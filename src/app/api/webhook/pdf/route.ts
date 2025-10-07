export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generatePDFFromURL } from '@/lib/pdfGenerator';
import { uploadPdfToBynder } from '@/lib/uploadPdfToBynder';

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
    const origin = request.headers.get('origin');
    const userAgent = request.headers.get('user-agent');
    
    console.log(`Webhook PDF request from: ${origin} (${userAgent})`);

    const body = await request.json();
    
    // Extract data from webhook payload
    const { slug, entityId, spaceId, environment, parameters } = body;
    
    // Validate required fields
    if (!slug?.['en-US']) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: slug',
        code: 'MISSING_SLUG'
      }, { status: 400 });
    }

    // Construct the internal Next.js page URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3050';
    const htmlPath = `${baseUrl}/pt-ed/${slug?.['en-US']}`;

    // Generate PDF using the separate function
    const result = await generatePDFFromURL(htmlPath, slug?.['en-US']);
    
    if (result.success) {
      // Upload PDF to Bynder
      const bynderResult = await uploadPdfToBynder(result.buffer, result.fileName!, entityId);
      
      console.log('Bynder upload result:', bynderResult);

      if (bynderResult.success) {
        return NextResponse.json({
          success: true,
          message: 'PDF generated and uploaded successfully',
          data: {
            slug: slug?.['en-US'],
            entityId,
            spaceId,
            environment,
            pdfInfo: {
              fileName: result.fileName,
              fileSize: result.buffer!.length,
              generatedAt: new Date().toISOString()
            },
            asset: bynderResult.asset,
            timestamp: new Date().toISOString()
          }
        }, { status: 200 });
      } else {
        return NextResponse.json({
          success: false,
          message: 'PDF generated but Bynder upload failed',
          error: bynderResult.error,
          data: {
            slug: slug?.['en-US'],
            entityId,
            spaceId,
            environment,
            pdfInfo: {
              fileName: result.fileName,
              fileSize: result.buffer!.length,
              generatedAt: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          }
        }, { status: 500 });
      }
    } else {
      // Log generation failure
      console.error(`Webhook PDF generation failed:`, {
        slug: slug?.['en-US'],
        entityId,
        error: result.error
      });

      return NextResponse.json({
        success: false,
        message: 'PDF generation failed',
        error: result.error,
        data: {
          slug: slug?.['en-US'],
          entityId,
          spaceId,
          environment,
          htmlPath,
          timestamp: new Date().toISOString(),
          parameters
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Webhook PDF generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process webhook request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
