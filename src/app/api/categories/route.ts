import { NextResponse } from "next/server";
import { getAllCategories, getIconsByCategory } from "@/lib/icons";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const categories = getAllCategories();

  const result = categories.map((name) => ({
    name,
    count: getIconsByCategory(name).length,
  }));

  return NextResponse.json(
    { categories: result },
    { headers: { ...CORS_HEADERS, ...CACHE_HEADERS } }
  );
}
