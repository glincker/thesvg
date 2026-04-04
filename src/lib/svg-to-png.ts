/**
 * SVG to PNG conversion utilities using the browser Canvas API.
 * Uses a fetch + blob URL approach to avoid tainted canvas issues with CORS.
 */

/**
 * Converts an SVG at the given URL to a PNG Blob at the requested pixel size.
 *
 * Handles SVGs with or without explicit width/height by relying on viewBox.
 * If the SVG has no viewBox or dimensions, it falls back to rendering at the
 * requested size directly.
 */
export async function svgToPng(svgSource: string, size: number): Promise<Blob> {
  // 1. Resolve SVG source text - accept raw SVG markup or a URL
  const svgText = svgSource.trimStart().startsWith("<")
    ? svgSource
    : await fetch(svgSource).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch SVG: ${r.statusText}`);
        return r.text();
      });

  // 2. Parse the SVG to extract viewBox so the canvas renders proportionally.
  //    We clone the SVG string, inject explicit width/height, then create a
  //    blob URL so the Image element loads it without CORS issues.
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svgEl = doc.documentElement;

  // Detect parse errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("SVG parse error: " + parseError.textContent);
  }

  // Resolve the aspect ratio from viewBox or existing width/height attributes.
  const viewBox = svgEl.getAttribute("viewBox");
  let aspectRatio = 1;
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/);
    if (parts.length === 4) {
      const vbW = parseFloat(parts[2]);
      const vbH = parseFloat(parts[3]);
      if (vbW > 0 && vbH > 0) {
        aspectRatio = vbW / vbH;
      }
    }
  } else {
    const attrW = parseFloat(svgEl.getAttribute("width") ?? "0");
    const attrH = parseFloat(svgEl.getAttribute("height") ?? "0");
    if (attrW > 0 && attrH > 0) {
      aspectRatio = attrW / attrH;
    }
  }

  // Calculate canvas dimensions keeping aspect ratio.
  const canvasW = aspectRatio >= 1 ? size : Math.round(size * aspectRatio);
  const canvasH = aspectRatio <= 1 ? size : Math.round(size / aspectRatio);

  // Stamp explicit width/height onto the SVG so browsers scale it correctly
  // when loaded as an Image.
  svgEl.setAttribute("width", String(canvasW));
  svgEl.setAttribute("height", String(canvasH));

  const serializer = new XMLSerializer();
  const updatedSvgText = serializer.serializeToString(doc);

  // 3. Create a blob URL from the modified SVG text.
  const svgBlob = new Blob([updatedSvgText], { type: "image/svg+xml" });
  const blobUrl = URL.createObjectURL(svgBlob);

  try {
    // 4. Load the SVG blob URL into an Image element.
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(new Error(`Image load failed: ${String(err)}`));
      image.src = blobUrl;
    });

    // 5. Draw onto a canvas and export as PNG.
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }
    ctx.drawImage(img, 0, 0, canvasW, canvasH);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob returned null"));
        }
      }, "image/png");
    });

    return pngBlob;
  } finally {
    // 6. Clean up the blob URL regardless of success or failure.
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * Triggers a browser download of a PNG Blob with the given filename.
 */
export function downloadPng(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Small delay before revoking so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
