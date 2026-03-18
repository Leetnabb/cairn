const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.json', '.csv', '.pdf', '.docx', '.pptx'];

export function getSupportedExtensions(): string[] {
  return SUPPORTED_EXTENSIONS;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  // Plain text formats
  if (['.txt', '.md', '.csv', '.json'].includes(ext)) {
    return await file.text();
  }

  // PDF: extract text from binary
  if (ext === '.pdf') {
    return await extractPdfText(file);
  }

  // DOCX/PPTX: extract text from XML inside ZIP
  if (ext === '.docx' || ext === '.pptx') {
    return await extractOfficeText(file);
  }

  return await file.text();
}

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  const textBlocks: string[] = [];
  const regex = /\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const decoded = match[1].replace(/\\n/g, '\n').replace(/\\r/g, '');
    if (decoded.trim().length > 2) {
      textBlocks.push(decoded.trim());
    }
  }

  return textBlocks.join(' ');
}

async function extractOfficeText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(buffer));

  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const readable = stripped.split(' ').filter(word => /^[\w\dæøåÆØÅ.,;:!?'"()-]+$/.test(word));
  return readable.join(' ');
}
