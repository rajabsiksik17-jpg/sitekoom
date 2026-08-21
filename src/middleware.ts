import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

const PROTECTED_PREFIXES = ["/admin", "/api/admin"];
const PUBLIC_PATHS = ["/admin/login", "/admin/forgot-password"];

function hasLocalePrefix(pathname: string) {
  return /^\/(ar|en)(?=\/|$)/.test(pathname);
}

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

  // 4) Locale routing (as-needed prefix: ar has no prefix, en has /en).
  if (hasLocalePrefix(pathname)) {
    const locale = pathname.split("/")[1];
    response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const locale = isLocale(cookieLocale ?? "") ? cookieLocale! : defaultLocale;

  if (locale === defaultLocale) {
    // Arabic: rewrite internally, keep the clean URL.
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  // English (or other non-default): redirect to a prefixed URL.
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
