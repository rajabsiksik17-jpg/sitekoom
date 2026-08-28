"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Languages, Menu, X, LogIn, UserRound, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers";
import { localizePath } from "@/lib/i18n/config";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";
import type { GeneralSettings } from "@/lib/settings";

type NavChild = { key: string; href: string; label: string };
type NavItem = { key: string; href: string; children?: NavChild[] };

function setLocaleCookie(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
}

export function Header({ settings, hasOffers, hasAchievements }: { settings: GeneralSettings; hasOffers: boolean; hasAchievements: boolean }) {
  const { locale, dict } = useLocale();
  const href = useLocalizedHref();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [heroTheme, setHeroTheme] = useState<"light" | "dark">("dark");
  const [clientAuthed, setClientAuthed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/client/me")
      .then((r) => (r.ok ? r.json() : { authenticated: false }))
      .then((d) => {
        if (active) setClientAuthed(Boolean(d.authenticated));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const apply = () => {
      const t = document.body.dataset.headerTheme;
      setHeroTheme(t === "light" ? "light" : "dark");
    };
    apply();
    window.addEventListener("header-theme-change", apply);
    return () => window.removeEventListener("header-theme-change", apply);
  }, []);

  const otherLocale = locale === "ar" ? "en" : "ar";
  const strippedPath = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  const switchHref = localizePath(strippedPath, otherLocale);

  const navItems: NavItem[] = [
    { key: "home", href: "/" },
    {
      key: "about",
      href: "/about",
      children: [
        { key: "about", href: "/about", label: dict.nav.about },
        { key: "projects", href: "/projects", label: dict.nav.projects },
      ],
    },
    {
      key: "services",
      href: "/services",
      children: [
        { key: "services", href: "/services", label: dict.nav.viewAllServices },
        ...(hasOffers ? [{ key: "offers", href: "/offers", label: dict.nav.offers }] : []),
      ],
    },
    ...(hasAchievements ? [{ key: "achievements", href: "/achievements" } as NavItem] : []),
    { key: "blog", href: "/blog" },
    { key: "contact", href: "/contact" },
  ];

  const isItemActive = (item: NavItem): boolean => {
    const paths = [item.href, ...(item.children?.map((c) => c.href) ?? [])];
    if (item.href === "/") return strippedPath === "/";
    return paths.some((p) => strippedPath === p || strippedPath.startsWith(`${p}/`));
  };

  const logo = settings.logo;
  const companyName = locale === "ar" ? settings.company_name_ar : settings.company_name_en;
  const logoDesktop = settings.logo_width_desktop ?? 170;
  const logoTablet = settings.logo_width_tablet ?? 140;
  const logoMobile = settings.logo_width_mobile ?? 120;

  // White text over a dark hero (top of page), dark text otherwise.
  const lightText = !scrolled && heroTheme === "dark";

  const linkClass = (active: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      lightText
        ? "text-white/85 hover:bg-white/10 hover:text-white"
        : "text-ink-800 hover:bg-brand-50 hover:text-brand-700",
      active && (lightText ? "text-white" : "text-brand-700"),
    );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "glass border-brand-100 shadow-soft"
          : lightText
            ? "border-white/10 bg-transparent"
            : "border-brand-100/60 bg-white/70 backdrop-blur",
      )}
    >
      <style>{`:root{--header-logo-w:${logoDesktop}px}@media(max-width:1023px){:root{--header-logo-w:${logoTablet}px}}@media(max-width:639px){:root{--header-logo-w:${logoMobile}px}}`}</style>
      <div className="container-site flex h-16 items-center justify-between gap-2 lg:h-20">
        <Link href={href("/")} className="flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={companyName} style={{ width: "var(--header-logo-w)", height: "auto" }} />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-lg font-extrabold text-white">
              S
            </span>
          )}
          <span className={cn("truncate text-lg font-extrabold tracking-tight sm:text-xl", lightText ? "text-white" : "text-ink-900")}>
            {companyName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = isItemActive(item);
            if (item.children?.length) {
              return (
                <div key={item.key} className="group relative">
                  <button
                    type="button"
                    className={cn(linkClass(active), "inline-flex items-center gap-1")}
                  >
                    {dict.nav[item.key as keyof typeof dict.nav]}
                    <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute start-0 top-full z-50 w-56 translate-y-2 rounded-2xl border border-brand-100 bg-white/95 p-2 opacity-0 shadow-card backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {item.children.map((c) => (
                      <Link
                        key={c.key}
                        href={href(c.href)}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-800 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link key={item.key} href={href(item.href)} className={linkClass(active)}>
                {dict.nav[item.key as keyof typeof dict.nav]}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={switchHref}
            onClick={() => setLocaleCookie(otherLocale)}
            className={cn(
              "btn px-2.5 py-2 text-sm sm:px-3",
              lightText
                ? "border border-white/30 bg-white/10 text-white hover:bg-white/20"
                : "btn-secondary",
            )}
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4" />
            <span className="font-semibold">{otherLocale === "ar" ? "العربية" : "EN"}</span>
          </Link>
          <Link href={href("/appointment")} className="btn-primary hidden px-4 py-2 text-sm sm:inline-flex">
            {dict.nav.appointment}
          </Link>
          <Link
            href={href(clientAuthed ? "/client-portal" : "/client-login")}
            className={cn(
              "hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold sm:inline-flex",
              lightText ? "text-white/90 hover:bg-white/10" : "text-brand-700 hover:bg-brand-50",
            )}
          >
            {clientAuthed ? <UserRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {clientAuthed ? (locale === "ar" ? "حسابي" : "My Account") : dict.nav.clientLogin}
          </Link>
          <button
            type="button"
            className={cn("btn p-2 lg:hidden", lightText ? "border border-white/30 bg-white/10 text-white" : "btn-secondary")}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-brand-100 bg-white/95 backdrop-blur-xl lg:hidden">
          <nav className="container-site flex flex-col gap-1 py-4">
            {navItems.map((item) => {
              if (item.children?.length) {
                const expanded = !!openGroups[item.key];
                return (
                  <div key={item.key}>
                    <div className="flex items-center">
                      <Link href={href(item.href)} onClick={() => setOpen(false)} className="flex-1 rounded-lg px-3 py-2.5 text-base font-medium text-ink-800 hover:bg-brand-50">
                        {dict.nav[item.key as keyof typeof dict.nav]}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setOpenGroups((g) => ({ ...g, [item.key]: !expanded }))}
                        className="rounded-lg p-2.5 text-brand-700 hover:bg-brand-50"
                        aria-label={expanded ? "Collapse" : "Expand"}
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                      </button>
                    </div>
                    {expanded && (
                      <div className="ms-3 border-s-2 border-brand-100 ps-2">
                        {item.children.map((c) => (
                          <Link key={c.key} href={href(c.href)} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium text-ink-700 hover:bg-brand-50">
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link key={item.key} href={href(item.href)} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-base font-medium text-ink-800 hover:bg-brand-50">
                  {dict.nav[item.key as keyof typeof dict.nav]}
                </Link>
              );
            })}
            <Link href={href("/appointment")} onClick={() => setOpen(false)} className="btn-primary mt-2 px-4 py-2.5 text-sm">
              {dict.nav.appointment}
            </Link>
            <Link href={href("/request-project")} onClick={() => setOpen(false)} className="btn-secondary mt-1 px-4 py-2.5 text-sm">
              {dict.nav.requestProject}
            </Link>
            <Link href={href(clientAuthed ? "/client-portal" : "/client-login")} onClick={() => setOpen(false)} className="btn-ghost mt-1 px-4 py-2.5 text-sm">
              {clientAuthed ? <UserRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {clientAuthed ? (locale === "ar" ? "حسابي" : "My Account") : dict.nav.clientLogin}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
