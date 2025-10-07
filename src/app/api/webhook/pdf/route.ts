export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server";
import { updatePatientEducationEntry } from "@/lib/contentfulUpdate";
import { generatePDFFromURL } from "@/lib/pdfGenerator";
import { uploadPdfToBynder } from "@/lib/uploadPdfToBynder";

interface ContentfulWebhookPayload {
  entityId: string;
  spaceId: string;
  environment: string;
  userId: string;
  slug: { [locale: string]: string };
  parameters?: Record<string, any>;
}

function errorResponse(
  message: string,
  code: string,
  status: number = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      ...extra,
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Validate custom header (security)
    const inboundToken = request.headers.get("x-contentful-pdf-generation");
    if (!inboundToken) {
      return errorResponse(
        "x-contentful-pdf-generation header is missing",
        "MISSING_HEADER",
        401,
      );
    }

    if (inboundToken !== process.env.CONTENTFUL_PDF_GENERATION_TOKEN) {
      return errorResponse("Invalid token", "INVALID_TOKEN", 401);
    }

    // 2️⃣ Parse and validate payload
    let body: ContentfulWebhookPayload;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON payload", "INVALID_JSON", 400);
    }

    const { slug, entityId, spaceId, environment, userId } = body;

    if (!slug?.["en-US"]) {
      return errorResponse("Missing required field: slug", "MISSING_SLUG");
    }

    if (!entityId || !spaceId || !environment) {
      return errorResponse("Missing required Contentful identifiers", "MISSING_IDENTIFIERS");
    }

    if (userId === process.env.CONTENTFUL_SYSTEM_USER_ID) {
      return errorResponse("Ignoring system user changes", "IGNORED_SYSTEM_USER");
    }

    // 3️⃣ Generate PDF
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3050";
    const slugValue = slug["en-US"];
    const htmlPath = `${baseUrl}/pt-ed/${slugValue}`;

    console.info(`[PDF Hook] Generating PDF for slug: ${slugValue}`);

    const pdfResult = await generatePDFFromURL(htmlPath, slugValue);
    if (!pdfResult.success || !pdfResult.buffer || !pdfResult.fileName) {
      return errorResponse("PDF generation failed", "PDF_GENERATION_FAILED", 500, {
        details: pdfResult.error,
      });
    }

    // 4️⃣ Upload PDF to Bynder
    console.info(`[PDF Hook] Uploading PDF to Bynder for entity: ${entityId}`);

    const bynderResult = await uploadPdfToBynder(
      pdfResult.buffer,
      pdfResult.fileName,
      entityId,
    );

    if (!bynderResult.success || !bynderResult.asset) {
      return errorResponse("Failed to upload PDF to Bynder", "BYNDER_UPLOAD_FAILED", 500, {
        details: bynderResult.error,
      });
    }

    // 5️⃣ Update Contentful entry with Bynder asset
    console.info(`[PDF Hook] Updating Contentful entry ${entityId} with asset`);

    const updateResult = await updatePatientEducationEntry({
      entryId: entityId,
      spaceId,
      environment,
      asset: bynderResult.asset,
    });

    if (!updateResult.success) {
      return errorResponse(
        "Failed to update Contentful entry with PDF asset",
        "CONTENTFUL_UPDATE_FAILED",
        500,
        { details: updateResult.error },
      );
    }

    // ✅ Success
    return NextResponse.json(
      {
        success: true,
        message: "PDF generated, uploaded to Bynder, and Contentful updated",
        data: {
          asset: bynderResult.asset,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[PDF Hook] Unexpected error:", err);
    return errorResponse(
      "Internal server error",
      "INTERNAL_ERROR",
      500,
      err instanceof Error
        ? { message: err.message, stack: err.stack }
        : { details: err },
    );
  }
}
