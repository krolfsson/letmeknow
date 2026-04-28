import Link from "next/link";
import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function BuyerPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader />
      <main className="pb-20 pt-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Köpare
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-fg sm:text-5xl">
            Varsågod.
          </h1>
          <p className="mt-4 max-w-xs text-lg text-subtle">
            Formuläret är på gång. Snart fyller du i vad du söker — tre
            minuter, sedan syns du för rätt mäklare.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Button asChild>
              <Link href="/">Tillbaka</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/agents-portal-123">Mäklarvyn →</Link>
            </Button>
          </div>
        </Container>
      </main>
    </div>
  );
}
