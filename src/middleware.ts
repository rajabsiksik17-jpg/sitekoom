import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale } from "@/lib/i18n/config";

const PROTECTED_PREFIXES = ["/admin", "/api/admin"];
const PUBLIC_PATHS = ["/admin/login", "/admin/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  let response = NextResponse.next({ request });

  // 1) Refresh Supabase session (cookies).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2) Admin route protection.
  const isAdminPath = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isAdminPath) {
    const isPublicAuthPage = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname === `${p}/`,
    );
    if (!user && !isPublicAuthPage) {
      // API routes must never be redirected to an HTML login page — return JSON
      // so the client can parse the error instead of receiving `<!DOCTYPE ...>`.
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      url.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(url);
    }
    if (user && isPublicAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 3) Skip non-page assets.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/manifest") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return response;
  }

  // 4) Locale routing.
  // Arabic is the DEFAULT locale and uses clean URLs (no prefix).
  // English uses the explicit `/en` prefix. The URL is the source of truth —
  // a no-prefix URL is ALWAYS Arabic, so navigation never flips languages.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    response.cookies.set("NEXT_LOCALE", "en", { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  // `/ar/...` → redirect to the clean (no-prefix) Arabic URL.
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/ar(?=\/|$)/, "") || "/";
    url.search = search;
    response.cookies.set("NEXT_LOCALE", "ar", { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return NextResponse.redirect(url);
  }

  // Default Arabic: rewrite internally, keep the clean URL.
  response.cookies.set("NEXT_LOCALE", "ar", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
