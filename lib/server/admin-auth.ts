import { NextRequest, NextResponse } from "next/server";

const ADMIN_HEADER = "x-admin-run-token";

export function requireAdminRunToken(request: NextRequest) {
  const expectedToken = process.env.ADMIN_RUN_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "ADMIN_RUN_TOKEN is not configured" },
      { status: 500 }
    );
  }

  const providedToken = request.headers.get(ADMIN_HEADER);

  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}

export { ADMIN_HEADER };
