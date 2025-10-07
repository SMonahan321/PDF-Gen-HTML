export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { updatePatientEducationEntry } from "@/lib/contentfulUpdate";
import { generatePDFFromURL } from "@/lib/pdfGenerator";
import { uploadPdfToBynder } from "@/lib/uploadPdfToBynder";

/**
 * Webhook endpoint for PDF generation
 * Triggered by external systems (Contentful, etc.)
 *
 * Expected payload from Contentful:
 * {
 *   "entityId": "entry-id",
 *   "environment": "master",
 *   "spaceId": "space-id",
 *   "userId": "user-id",
 *   "slug": {
 *     "en-US": "patient-education-slug"
 *   },
 *   "parameters": {
 *     "text": "Entity version: 1"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // should be secret, custom header coming in from Contentful
    const inboundRevalToken = request.headers.get(
      "x-contentful-pdf-generation",
    );
    // Check for secret to confirm this is a valid request
    if (!inboundRevalToken) {
      return NextResponse.json(
        {
          success: false,
          error: "x-contentful-pdf-generation header not defined",
        },
        { status: 401 },
      );
    } else if (
      inboundRevalToken !== process.env.CONTENTFUL_PDF_GENERATION_TOKEN
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Extract data from webhook payload
    const { slug, entityId, spaceId, environment, parameters, userId } = body;

    if (userId === process.env.CONTENTFUL_SYSTEM_USER_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "Ignoring system user changes",
        },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!slug?.["en-US"]) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: slug",
          code: "MISSING_SLUG",
        },
        { status: 400 },
      );
    }

    // Construct the internal Next.js page URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3050";
    const htmlPath = `${baseUrl}/pt-ed/${slug?.["en-US"]}`;

    // Generate PDF using the separate function
    const result = await generatePDFFromURL(htmlPath, slug?.["en-US"]);

    if (result.success) {
      // Upload PDF to Bynder
      const bynderResult = await uploadPdfToBynder(
        result.buffer,
        result.fileName!,
        entityId,
      );

      if (bynderResult.success) {
        const contentfulUpdate = await updatePatientEducationEntry({
          entryId: entityId,
          spaceId,
          environment,
          asset: bynderResult.asset,
        });
        if (contentfulUpdate.success) {
          return NextResponse.json(
            {
              success: true,
              message: "PDF generated and uploaded successfully",
              data: {
                asset: bynderResult.asset,
                timestamp: new Date().toISOString(),
              },
            },
            { status: 200 },
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "PDF generation failed",
      },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to process webhook request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
