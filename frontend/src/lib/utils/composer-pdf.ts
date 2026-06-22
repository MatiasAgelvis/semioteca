import { marked } from 'marked';

/**
 * Wraps rendered HTML in a full print-ready document with print CSS.
 */
export function buildPrintDocument(html: string, title: string): string {
  const safeTitle = escapeHtml(title || 'Documento sin título');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1a1a1a;
      max-width: 42rem;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    h1 {
      font-size: 1.6rem;
      margin-top: 0;
      margin-bottom: 0.3rem;
    }

    h2 {
      font-size: 1.15rem;
      margin-top: 0;
      margin-bottom: 0.5rem;
      page-break-before: always;
    }

    h2:first-of-type { page-break-before: auto; }

    p { margin: 0 0 0.8rem; orphans: 3; widows: 3; }

    blockquote {
      margin: 0 0 1rem;
      padding: 0.3rem 0 0.3rem 1rem;
      border-left: 3px solid #ccc;
      color: #555;
      font-size: 0.9rem;
      font-style: italic;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    em { font-style: italic; }

    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 2rem 0;
    }

    @page {
      size: A4;
      margin: 15mm;
      @bottom-center {
        content: counter(page);
        font-size: 0.8rem;
        color: #999;
      }
    }

    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Opens a print window with the rendered document and triggers the print dialog.
 * Falls back to showing a toast if popups are blocked.
 */
export async function downloadPdf(
  markdown: string,
  docTitle: string,
  onPopupBlocked?: () => void,
): Promise<void> {
  const html = marked.parse(markdown) as string;
  const printDoc = buildPrintDocument(html, docTitle);

  const win = window.open('', '_blank');
  if (!win) {
    onPopupBlocked?.();
    return;
  }

  win.document.write(printDoc);
  win.document.close();

  await waitForImages(win);
  win.print();

  // Auto-close after print dialog is dismissed.
  // Some browsers fire this; on others the user closes manually.
  win.onafterprint = () => {
    try {
      win.close();
    } catch {
      // Window may already be closed
    }
  };
}

/**
 * Triggers a download of the raw Markdown file.
 */
export function downloadMarkdown(markdown: string, docTitle: string): void {
  const slug = (docTitle || 'documento')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñ]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `semioteca-${slug}-${date}.md`;

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function waitForImages(win: Window): Promise<void> {
  const images = win.document.querySelectorAll('img');
  if (images.length === 0) return Promise.resolve();

  const promises = Array.from(images).map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Don't block on broken images
        }
      }),
  );

  return Promise.all(promises).then(() => undefined);
}
