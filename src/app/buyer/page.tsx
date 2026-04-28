import Link from "next/link";
import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function BuyerPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-accent-soft via-background to-[#ebece8] dark:from-[#152722] dark:via-[#121816] dark:to-[#121816]">
      <SiteHeader />
      <main className="py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-2xl rounded-3xl border border-border-brand bg-surface p-6 shadow-[0_1px_3px_rgb(0_0_0/0.06)] dark:bg-surface/90 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent dark:text-accent-foreground">
              För köpare
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Ditt köparintresse börjar här
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Kommer strax (nästa byggsteg): ett kort formulär – område, budget,
              bostadstyp och tidsplan – så att mäklare som jobbar på din marknad
              kan nå dig via telefon eller e-post.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/">Till startsidan</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/agents-portal-123">För mäklare · översikt</Link>
              </Button>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
