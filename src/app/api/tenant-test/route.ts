import { NextResponse } from "next/server";
import {
  getTenantContext,
  TenantMismatchError,
  MissingTenantContextError,
  UnauthenticatedTenantError,
} from "@/lib/tenant";

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const context = await getTenantContext();
    return NextResponse.json({
      status: "ok",
      context: {
        lodgeId: context.lodgeId,
        lodgeSubdomain: context.lodgeSubdomain,
        lodgeName: context.lodgeName,
        userId: context.userId,
        userEmail: context.userEmail,
        role: context.role,
      },
    });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          code: 403,
          message: err.message,
        },
        { status: 403 }
      );
    }

    if (err instanceof MissingTenantContextError) {
      return NextResponse.json(
        {
          error: "BAD_REQUEST",
          code: 400,
          message: err.message,
        },
        { status: 400 }
      );
    }

    if (err instanceof UnauthenticatedTenantError) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          code: 401,
          message: err.message,
        },
        { status: 401 }
      );
    }

    console.error("[TenantTestRoute] Unexpected error:", err);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        code: 500,
        message: "An unexpected error occurred while resolving tenant context.",
      },
      { status: 500 }
    );
  }
}
