"use client";

import Link from "next/link";
import { Search, Home } from "lucide-react";
import { useLocale } from "@/components/providers";

export default function NotFound() {
  const { dict } = useLocale();
  return (
    <section className="container-site flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="bg-brand-gradient bg-clip-text text-[120px] font-extrabold leading-none text-transparent">
        404
      </p>
      <h1 className="mt-4 text-3xl font-extrabold text-ink-900">{dict.notFound.title}</h1>
      <p className="mt-3 max-w-md text-gray-600">{dict.notFound.message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary px-6 py-3">
          <Home className="h-4 w-4" />
          {dict.common.backHome}
        </Link>
        <Link href="/search" className="btn-secondary px-6 py-3">
          <Search className="h-4 w-4" />
          {dict.common.search}
        </Link>
      </div>
    </section>
  );
}
