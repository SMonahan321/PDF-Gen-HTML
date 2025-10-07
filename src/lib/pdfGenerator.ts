import puppeteer from 'puppeteer';

export interface PDFGenerationOptions {
  htmlPath: string;
  slug: string;
  fileName?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  fileName?: string;
  buffer?: Buffer;
  error?: string;
}

/**
 * Generates a PDF from HTML content using Puppeteer
 */
export async function generatePDF(options: PDFGenerationOptions): Promise<PDFGenerationResult> {
  const { htmlPath, slug, fileName } = options;
  
  try {
    console.log(`Starting PDF generation for slug: ${slug}`);
    console.log(`HTML path: ${htmlPath}`);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    );
    
    await page.goto(htmlPath, {
      waitUntil: 'networkidle2',
      timeout: 10000, // 10 seconds
    });

    // Prepare filename
    const finalFileName = fileName || `${slug}.pdf`;
    
    // Generate PDF as buffer (stream)
    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });
    
    await browser.close();

    const fileBuffer = Buffer.from(pdfBuffer);
    
    return {
      success: true,
      fileName: finalFileName,
      buffer: fileBuffer,
    };
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generates a PDF from HTML URL with default settings
 */
export async function generatePDFFromURL(htmlPath: string, slug: string): Promise<PDFGenerationResult> {
  return generatePDF({ htmlPath, slug });
}
