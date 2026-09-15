import { NextRequest, NextResponse } from "next/server";

// Gates the whole demo behind a shared username/password while it's hosted
// on a public free-tier URL for client review. No-ops (open access) unless
// both env vars are set, so local dev and any real deploy are unaffected.
export function middleware(req: NextRequest) {
  const user = process.env.DEMO_AUTH_USER;
  const pass = process.env.DEMO_AUTH_PASS;
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = auth.split(" ");

  if (scheme === "Basic" && encoded) {
    const [u, p] = atob(encoded).split(":");
    if (u === user && p === pass) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="toonymous demo"' },
  });
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
