import Link from "next/link";
import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function BuyerPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col justify-center pb-14 pt-10">
        <Container className="max-w-xl">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-green">
            Köpersidan
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-fg">
            Varsågod.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-subtle">
            Formulär kommer nästa sprint: du lägger i område, mål för boende –
            mäklarna ser vad som matchar på knowwhatiwant.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button variant="primary" asChild>
              <Link href="/">Till startsidan</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/agents-portal-123">Mäklare · leta leads</Link>
            </Button>
          </div>
        </Container>
      </main>
    </div>
  );
}
