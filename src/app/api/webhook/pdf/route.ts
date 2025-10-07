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
    // Verify webhook origin (optional security)
    const origin = request.headers.get("origin");
    const userAgent = request.headers.get("user-agent");

    console.log(`📨 Webhook PDF request from: ${origin} (${userAgent})`);

    const body = await request.json();

    // Extract data from webhook payload
    const { slug, entityId, spaceId, environment } = body;

    // Get the system user ID from environment variable
    const SYSTEM_USER_ID = process.env.CONTENTFUL_SYSTEM_USER_ID || "SYSTEM";

    // 🛡️ INFINITE LOOP PREVENTION - Check if last publisher was system user
    // Extract user information from webhook payload
    const publishedBy = body.sys?.publishedBy?.sys?.id;
    const updatedBy = body.sys?.updatedBy?.sys?.id;

    console.log(`👤 Entry published by: ${publishedBy}`);
    console.log(`👤 Entry updated by: ${updatedBy}`);
    console.log(`🤖 System user ID: ${SYSTEM_USER_ID}`);

    // If the last publisher was the system user, skip processing
    if (publishedBy === SYSTEM_USER_ID) {
      console.log(
        "⏭️  Skipping PDF generation - last published by system user (preventing infinite loop)",
      );

      const response = NextResponse.json(
        {
          success: true,
          message: "Webhook skipped - published by system user",
          skipped: true,
          reason: "infinite-loop-prevention",
          workflow: {
            pdfGeneration: {
              status: "skipped",
              reason: "infinite-loop-prevention",
            },
            bynderUpload: {
              status: "skipped",
              reason: "infinite-loop-prevention",
            },
            contentfulUpdate: {
              status: "skipped",
              reason: "infinite-loop-prevention",
            },
          },
          metadata: {
            publishedBy,
            systemUserId: SYSTEM_USER_ID,
            slug: slug?.["en-US"],
            entityId,
            spaceId,
            environment: environment || "master",
            processedAt: new Date().toISOString(),
          },
        },
        { status: 200 },
      );

      // Add custom headers
      response.headers.set("X-Contentful-PDF-Generation", "skipped");
      response.headers.set("X-PDF-Entry-ID", entityId || "unknown");
      response.headers.set("X-PDF-Workflow-Status", "infinite-loop-prevention");
      response.headers.set("X-PDF-Skip-Reason", "system-user-published");

      return response;
    }

    console.log("✅ Proceeding with PDF generation - published by human user");

    // Validate required fields
    if (!slug?.["en-US"]) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          error: {
            code: "MISSING_SLUG",
            message: "Missing required field: slug",
            field: 'slug["en-US"]',
          },
          metadata: {
            entityId,
            spaceId,
            environment: environment || "master",
            processedAt: new Date().toISOString(),
          },
        },
        { status: 400 },
      );

      // Add custom headers
      response.headers.set("X-Contentful-PDF-Generation", "validation-failed");
      response.headers.set("X-PDF-Error-Type", "MISSING_SLUG");

      return response;
    }

    // Construct the internal Next.js page URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const htmlPath = `${baseUrl}/pt-ed/${slug?.["en-US"]}`;

    // Generate PDF using the separate function
    const result = await generatePDFFromURL(htmlPath, slug?.["en-US"]);

    if (result.success) {
      // Upload PDF to Bynder
      const bynderResult = await uploadPdfToBynder(
        result.buffer,
        result.fileName || "generated.pdf",
      );

      console.log("Bynder upload result:", bynderResult);

      if (bynderResult.success) {
        // Extract Bynder asset information
        const uploadResult = bynderResult.uploadResult;
        const bynderAssetId = uploadResult?.mediaid;

        // Create Contentful asset link object
        const assetLink = {
          sys: {
            type: "Link",
            linkType: "Asset",
            id: bynderAssetId,
          },
        };

        // Update Contentful entry with PDF asset
        let contentfulUpdateResult = null;
        if (entityId && spaceId) {
          try {
            console.log(
              `📝 Updating Contentful entry: ${entityId} in space: ${spaceId}`,
            );
            console.log(`🔗 Linking Bynder asset: ${bynderAssetId}`);

            contentfulUpdateResult = await updatePatientEducationEntry({
              entryId: entityId,
              spaceId,
              environment: environment || "master",
              asset: assetLink,
            });

            if (contentfulUpdateResult.success) {
              console.log(
                `✅ Contentful entry updated successfully: ${entityId}`,
              );
            } else {
              console.error(
                `❌ Failed to update Contentful entry: ${entityId}`,
                contentfulUpdateResult.error,
              );
            }
          } catch (updateError) {
            console.error(
              `❌ Error updating Contentful entry: ${entityId}`,
              updateError,
            );
            contentfulUpdateResult = {
              success: false,
              error:
                updateError instanceof Error
                  ? updateError.message
                  : "Unknown error",
            };
          }
        } else {
          console.warn(
            "⚠️  Missing entityId or spaceId - skipping Contentful update",
          );
        }

        // Build comprehensive response with custom headers
        const response = NextResponse.json(
          {
            success: true,
            message: "PDF generation workflow completed successfully",
            workflow: {
              pdfGeneration: {
                status: "completed",
                fileName: result.fileName,
                fileSize: result.buffer?.length,
                timestamp: new Date().toISOString(),
              },
              bynderUpload: {
                status: "completed",
                assetId: bynderAssetId,
                mediaid: uploadResult?.mediaid,
                batchId: uploadResult?.batchId,
                s3Location: uploadResult?.originalFileS3location,
                mediaitems: uploadResult?.mediaitems,
                timestamp: new Date().toISOString(),
              },
              contentfulUpdate: contentfulUpdateResult
                ? {
                    status: contentfulUpdateResult.success
                      ? "completed"
                      : "failed",
                    entryId: entityId,
                    error: contentfulUpdateResult.error,
                    timestamp: new Date().toISOString(),
                  }
                : {
                    status: "skipped",
                    reason: "Missing entityId or spaceId",
                  },
            },
            metadata: {
              slug: slug?.["en-US"],
              entityId,
              spaceId,
              environment: environment || "master",
              publishedBy,
              updatedBy,
              processedAt: new Date().toISOString(),
            },
          },
          { status: 200 },
        );

        // Add custom headers
        response.headers.set("X-Contentful-PDF-Generation", "completed");
        response.headers.set("X-PDF-Asset-ID", bynderAssetId || "unknown");
        response.headers.set("X-PDF-Entry-ID", entityId || "unknown");
        response.headers.set("X-PDF-Workflow-Status", "success");

        return response;
      } else {
        // Bynder upload failed
        console.error(`❌ Bynder upload failed:`, bynderResult.error);

        const response = NextResponse.json(
          {
            success: false,
            message: "PDF generation workflow failed at Bynder upload",
            workflow: {
              pdfGeneration: {
                status: "completed",
                fileName: result.fileName,
                fileSize: result.buffer?.length,
                timestamp: new Date().toISOString(),
              },
              bynderUpload: {
                status: "failed",
                error: bynderResult.error,
                timestamp: new Date().toISOString(),
              },
              contentfulUpdate: {
                status: "skipped",
                reason: "Bynder upload failed",
              },
            },
            metadata: {
              slug: slug?.["en-US"],
              entityId,
              spaceId,
              environment: environment || "master",
              publishedBy,
              updatedBy,
              processedAt: new Date().toISOString(),
            },
          },
          { status: 500 },
        );

        // Add custom headers
        response.headers.set("X-Contentful-PDF-Generation", "failed");
        response.headers.set("X-PDF-Entry-ID", entityId || "unknown");
        response.headers.set("X-PDF-Workflow-Status", "bynder-upload-failed");
        response.headers.set("X-PDF-Error-Stage", "bynder-upload");

        return response;
      }
    } else {
      // PDF generation failed
      console.error(`❌ PDF generation failed:`, {
        slug: slug?.["en-US"],
        entityId,
        error: result.error,
      });

      const response = NextResponse.json(
        {
          success: false,
          message: "PDF generation workflow failed at PDF generation",
          workflow: {
            pdfGeneration: {
              status: "failed",
              error: result.error,
              htmlPath,
              timestamp: new Date().toISOString(),
            },
            bynderUpload: {
              status: "skipped",
              reason: "PDF generation failed",
            },
            contentfulUpdate: {
              status: "skipped",
              reason: "PDF generation failed",
            },
          },
          metadata: {
            slug: slug?.["en-US"],
            entityId,
            spaceId,
            environment: environment || "master",
            publishedBy,
            updatedBy,
            processedAt: new Date().toISOString(),
            parameters,
          },
        },
        { status: 500 },
      );

      // Add custom headers
      response.headers.set("X-Contentful-PDF-Generation", "failed");
      response.headers.set("X-PDF-Entry-ID", entityId || "unknown");
      response.headers.set("X-PDF-Workflow-Status", "pdf-generation-failed");
      response.headers.set("X-PDF-Error-Stage", "pdf-generation");
      response.headers.set("X-PDF-HTML-Path", htmlPath);

      return response;
    }
  } catch (error) {
    console.error("❌ Webhook PDF critical error:", error);

    const response = NextResponse.json(
      {
        success: false,
        message: "PDF generation workflow encountered a critical error",
        error: {
          type: "CRITICAL_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        metadata: {
          processedAt: new Date().toISOString(),
        },
      },
      { status: 500 },
    );

    // Add custom headers
    response.headers.set("X-Contentful-PDF-Generation", "error");
    response.headers.set("X-PDF-Workflow-Status", "critical-error");
    response.headers.set("X-PDF-Error-Type", "CRITICAL_ERROR");

    return response;
  }
}
