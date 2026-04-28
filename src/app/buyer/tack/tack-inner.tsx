"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function TackInner() {
  const sp = useSearchParams();
  const id = sp.get("id");

  return (
    <main className="mx-auto max-w-xl px-6 pb-16 pt-12">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-green">
        Inskickad
      </p>
      <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-fg">
        Toppen — du finns med.
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-subtle">
        knowwhatiwant har sparat din signal
        {id ? (
          <>
            {" "}
            <span className="tabular-nums text-fg">({id.slice(0, 8)}…)</span>
          </>
        ) : null}
        . Mäklare som matchar kontaktar dig med telefon eller mejl —
        ingenting händer i själva sajten förutom precis den här rutan ett tag
        framåt.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button asChild>
          <Link href="/">Till startsidan</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/agents-portal-123">Mäklarvy →</Link>
        </Button>
      </div>
    </main>
  );
}
