import Link from "next/link";
import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function AgentsPortalPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-accent-soft via-background to-[#ebece8] dark:from-[#152722] dark:via-[#121816] dark:to-[#121816]">
      <SiteHeader />
      <main className="py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl border border-border-brand bg-surface p-6 shadow-[0_1px_3px_rgb(0_0_0/0.06)] dark:bg-surface/90 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent dark:text-accent-foreground">
                  För mäklare och team
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  Mäklaröversikt
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Kommer snart: filtrerbar köparlista och kopiera
                  kontaktuppgifter. Hjälper dig fokusera på områden och uppdrag
                  du redan täcker – tillsammans med köpare som anmält sitt
                  intresse tydligt.
                </p>
              </div>
              <Button variant="secondary" asChild>
                <Link href="/buyer">Köparanmälan</Link>
              </Button>
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-border-brand bg-surface-subtle/80 p-6 text-sm text-muted dark:bg-accent-soft/10 dark:text-muted">
              Endast delad webbadress – inga lösenord i den här MVP-versionen.
              Köpare börjar på startsidan; bokmärk den här länken om du behöver
              återkomma ofta eller dela den i ett team.
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
