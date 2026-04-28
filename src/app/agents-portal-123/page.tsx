import Link from "next/link";
import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function AgentsPortalPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader />
      <main className="pb-20 pt-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Mäklare
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-fg sm:text-5xl">
            Listan byggs.
          </h1>
          <p className="mt-4 max-w-xs text-lg text-subtle">
            Köpare anmäler sig. Du filtrar på område och budget, kopierar
            kontakt och ringer. Inget mer än så.
          </p>
          <p className="mt-5 text-sm text-subtle">
            Hemlig URL · inga konton i MVP-versionen.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Button asChild>
              <Link href="/buyer">Se köparsidan</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">← Start</Link>
            </Button>
          </div>
        </Container>
      </main>
    </div>
  );
}
