export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  checks: ValidationCheck[];
}

const MAX_FILE_SIZE = 50 * 1024; // 50KB

function hasMaliciousAttributes(doc: Document): { hasOnHandlers: boolean; hasJavascriptHref: boolean } {
  let hasOnHandlers = false;
  let hasJavascriptHref = false;

  const allElements = doc.querySelectorAll("*");
  for (const el of Array.from(allElements)) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        hasOnHandlers = true;
      }
      if (name === "href" || name.endsWith(":href")) {
        const val = attr.value.replace(/[\s\x00-\x1F\x7F]/g, "").toLowerCase();
        if (val.startsWith("javascript:")) {
          hasJavascriptHref = true;
        }
      }
    }
  }

  return { hasOnHandlers, hasJavascriptHref };
}

export function validateSvg(content: string, fileSize: number): ValidationResult {
  const checks: ValidationCheck[] = [];

  // Check 1: File size
  const sizeKB = (fileSize / 1024).toFixed(1);
  const sizeOk = fileSize <= MAX_FILE_SIZE;
  checks.push({
    name: "File size",
    passed: sizeOk,
    message: sizeOk
      ? `${sizeKB}KB - within the 50KB limit`
      : `${sizeKB}KB - exceeds the 50KB limit`,
  });

  // Parse SVG with DOMParser (browser only)
  let doc: Document | null = null;
  let parseError = false;

  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(content, "image/svg+xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
      parseError = true;
    }
  } catch {
    parseError = true;
  }

  // Check 2: Valid SVG/XML
  checks.push({
    name: "Valid SVG markup",
    passed: !parseError && doc !== null,
    message:
      !parseError && doc !== null
        ? "Parses as valid SVG/XML"
        : "File is not valid SVG/XML",
  });

  if (parseError || !doc) {
    // Can't do further checks without a parsed doc
    return { valid: false, checks };
  }

  const svgEl = doc.documentElement;

  // Check 3: Has viewBox
  const hasViewBox =
    svgEl.hasAttribute("viewBox") || svgEl.hasAttribute("viewbox");
  checks.push({
    name: "viewBox attribute",
    passed: hasViewBox,
    message: hasViewBox
      ? `viewBox="${svgEl.getAttribute("viewBox") ?? svgEl.getAttribute("viewbox")}"`
      : "Missing viewBox attribute - icons must have a viewBox",
  });

  // Check 4: No embedded scripts
  const scriptTags = doc.querySelectorAll("script");
  const hasScripts = scriptTags.length > 0;

  const { hasOnHandlers, hasJavascriptHref } = hasMaliciousAttributes(doc);

  const scriptFree = !hasScripts && !hasOnHandlers && !hasJavascriptHref;
  checks.push({
    name: "No embedded scripts",
    passed: scriptFree,
    message: scriptFree
      ? "No script tags or event handlers found"
      : "Contains script tags or JavaScript event handlers - not allowed",
  });

  // Check 5: No embedded raster images (base64)
  const imageEls = doc.querySelectorAll("image");
  let hasBase64Images = false;
  imageEls.forEach((img) => {
    const href =
      img.getAttribute("href") ??
      img.getAttribute("xlink:href") ??
      "";
    if (href.startsWith("data:image")) {
      hasBase64Images = true;
    }
  });
  checks.push({
    name: "No embedded raster images",
    passed: !hasBase64Images,
    message: !hasBase64Images
      ? "No base64-encoded raster images found"
      : "Contains embedded raster images - use vector paths instead",
  });

  const valid = checks.every((c) => c.passed);
  return { valid, checks };
}
