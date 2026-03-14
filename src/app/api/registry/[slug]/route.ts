import { NextRequest, NextResponse } from "next/server";
import { getIconBySlug } from "@/lib/icons";
import fs from "fs";
import path from "path";

const BASE_URL = "https://thesvg.org";
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
};

function readSvgFile(slug: string, variantPath: string): string | null {
  try {
    // variantPath is like "/icons/github/default.svg" — strip leading slash
    const relativePath = variantPath.startsWith("/")
      ? variantPath.slice(1)
      : variantPath;
    const absolutePath = path.join(process.cwd(), "public", relativePath);
    return fs.readFileSync(absolutePath, "utf-8").trim();
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const icon = getIconBySlug(slug);

  if (!icon) {
    return NextResponse.json(
      { error: "Icon not found" },
      { status: 404, headers: { ...CORS_HEADERS } }
    );
  }

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");

  // ?format=raw — return just the default SVG with image/svg+xml content type
  if (format === "raw") {
    const defaultPath = icon.variants.default;
    const svgContent = readSvgFile(slug, defaultPath);

    if (!svgContent) {
      return NextResponse.json(
        { error: "SVG file not found" },
        { status: 404, headers: { ...CORS_HEADERS } }
      );
    }

    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        ...CORS_HEADERS,
        ...CACHE_HEADERS,
      },
    });
  }

  // Build the variants object with inline SVG content
  type VariantData = {
    url: string;
    svg: string | null;
  };

  const variants: Record<string, VariantData> = {};

  for (const [key, variantPath] of Object.entries(icon.variants)) {
    if (!variantPath) continue;

    // Extract filename from path for URL construction
    // variantPath: "/icons/github/wordmark-light.svg"
    const fileName = path.basename(variantPath); // "wordmark-light.svg"
    const variantName = fileName.replace(".svg", ""); // "wordmark-light"

    const url = `${BASE_URL}/icons/${slug}/${variantName}.svg`;
    const svg = readSvgFile(slug, variantPath);

    variants[key] = { url, svg };
  }

  const response = {
    name: slug,
    title: icon.title,
    categories: icon.categories,
    hex: icon.hex,
    url: icon.url ?? null,
    variants,
    cdn: {
      jsdelivr: `${CDN_BASE}/${slug}/{variant}.svg`,
      direct: `${BASE_URL}/icons/${slug}/{variant}.svg`,
    },
  };

  return NextResponse.json(response, {
    status: 200,
    headers: { ...CORS_HEADERS, ...CACHE_HEADERS },
  });
}
