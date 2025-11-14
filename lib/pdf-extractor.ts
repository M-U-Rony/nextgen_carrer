export interface PDFExtractionResult {
  text: string;
  numPages: number;
  info?: any;
}

/**
 * Extract text content from PDF file buffer
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<PDFExtractionResult> {
  try {
    // Dynamic import to avoid build-time canvas dependency issues
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(pdfBuffer);
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF. Please ensure the file is a valid PDF.");
  }
}

/**
 * Validate PDF file (basic checks)
 */
export function validatePDF(buffer: Buffer): boolean {
  // Check PDF magic number (PDF files start with %PDF)
  const pdfHeader = buffer.toString("ascii", 0, 4);
  return pdfHeader === "%PDF";
}

