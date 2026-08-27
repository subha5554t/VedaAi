import path from 'path';
import fs from 'fs';

/**
 * Convert all pages of a PDF to base64-encoded PNG strings.
 * Uses pdf2pic (ImageMagick) for reliable rasterization.
 * Returns array of base64 strings — one per page.
 */
export async function pdfToBase64Images(pdfPath: string): Promise<string[]> {
  const { fromPath } = await import('pdf2pic');
  const outputDir = path.join(path.dirname(pdfPath), '_pages_' + path.basename(pdfPath, '.pdf'));

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ext = path.extname(pdfPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    return [_fileToBase64(pdfPath)];
  }

  const pageCount = await getPdfPageCount(pdfPath);
  if (pageCount === 0) throw new Error('PDF has no pages or could not be read');

  const convert = fromPath(pdfPath, {
    density: 150,        // DPI — 150 is good balance of quality vs speed
    saveFilename: 'page',
    savePath: outputDir,
    format: 'png',
    width: 1200,
    height: 1600,
    preserveAspectRatio: true,
  });

  const base64Images: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    try {
      const result = await convert(i, { responseType: 'base64' });
      if (result.base64) {
        base64Images.push(result.base64);
      }
    } catch (err: any) {
      console.error(`Failed to convert page ${i}:`, err.message);
      // Push empty string as placeholder so indexes stay aligned
      base64Images.push('');
    }
  }

  // Cleanup temp directory
  try { fs.rmSync(outputDir, { recursive: true, force: true }); } catch {}

  // Cleanup temp directory
  try { fs.rmSync(outputDir, { recursive: true, force: true }); } catch {}

  return base64Images;
}

function _fileToBase64(filePath: string): string {
  try { return fs.readFileSync(filePath).toString('base64'); } catch { return ''; }
}

/**
 * Save a specific PDF page as a PNG file on disk.
 * Used by the page-image route to serve rendered pages to the frontend.
 */
export async function savePdfPageAsPng(
  pdfPath: string,
  pageNumber: number, // 1-indexed
  outputPath: string
): Promise<void> {
  const { fromPath } = await import('pdf2pic');

  const outputDir = path.dirname(outputPath);
  const outputBase = path.basename(outputPath, '.png');

  const convert = fromPath(pdfPath, {
    density: 150,
    saveFilename: outputBase,
    savePath: outputDir,
    format: 'png',
    width: 1200,
    height: 1600,
    preserveAspectRatio: true,
  });

  const result = await convert(pageNumber, { responseType: 'image' });
  
  // pdf2pic forcefully appends `.pageNumber.png` (or sometimes `.png` natively). 
  // We MUST rename it exactly to the requested `outputPath`.
  if (result && result.path && result.path !== outputPath) {
    if (fs.existsSync(result.path)) {
      fs.renameSync(result.path, outputPath);
    }
  }
}

/**
 * Get the number of pages in a PDF using pdf-parse.
 */
export async function getPdfPageCount(pdfPath: string): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(buffer);
    return data.numpages;
  } catch (err: any) {
    console.error('getPdfPageCount failed:', err.message);
    // Fallback: try to estimate from file size
    return 1;
  }
}

/**
 * Extract raw text from a PDF (for text-only questions — faster than vision).
 */
export async function extractPdfText(pdfPath: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err: any) {
    console.error('extractPdfText failed:', err.message);
    return '';
  }
}

/**
 * Get or generate the cached PNG for a given PDF page.
 * Serves as the image endpoint cache layer.
 */
export async function getOrGeneratePageImage(
  pdfPath: string,
  pageNumber: number, // 1-indexed
  cacheDir: string
): Promise<string | null> {
  const cacheKey = `${path.basename(pdfPath, '.pdf')}_p${pageNumber}.png`;
  const cachePath = path.join(cacheDir, cacheKey);

  if (fs.existsSync(cachePath)) {
    return cachePath;
  }

  // If the uploaded file is ALREADY an image, simply serve it back instead of failing pdf conversions!
  const ext = path.extname(pdfPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    return pdfPath;
  }

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  try {
    await savePdfPageAsPng(pdfPath, pageNumber, cachePath);
    return cachePath;
  } catch (err: any) {
    console.error(`getOrGeneratePageImage failed for page ${pageNumber}:`, err.message);
    return null;
  }
}
