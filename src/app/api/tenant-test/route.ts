import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const headerList = await headers();
  return NextResponse.json({
    status: "ok",
    lodgeId: headerList.get("x-lodge-id"),
    lodgeName: headerList.get("x-lodge-name"),
    lodgeSubdomain: headerList.get("x-lodge-subdomain"),
  });
}

