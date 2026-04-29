"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function TackInner() {
  const sp = useSearchParams();
  const id = sp.get("id");

  return (
    <main className="relative mx-auto max-w-2xl px-4 pb-16 pt-10">
      <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
        <div className="h-[240px] w-[520px] rounded-full bg-emerald-400/15 opacity-40 blur-3xl" />
      </div>

      <div className="relative rounded-2xl border border-white/40 bg-white/80 px-6 py-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06)] ring-1 ring-white/50 backdrop-blur-md sm:px-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
          Inskickad
        </p>
        <h1 className="mx-auto mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-gray-900 md:text-5xl">
          Toppen — du finns med.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
          wanti har sparat din signal
          {id ? (
            <>
              {" "}
              <span className="tabular-nums text-gray-900">
                ({id.slice(0, 8)}…)
              </span>
            </>
          ) : null}
          . Mäklare som matchar kontaktar dig med telefon eller mejl när de har
          något relevant.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild>
            <Link href="/">Till startsidan</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/agents-portal-123">Mäklarvy →</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
