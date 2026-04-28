import Link from "next/link";
import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-accent-soft via-background to-[#ebece8] dark:from-[#152722] dark:via-[#121816] dark:to-[#121816]">
      <SiteHeader />
      <main className="py-10 sm:py-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
            <section className="space-y-5">
              <p className="inline-flex max-w-full w-fit flex-wrap items-center gap-2 rounded-full border border-border-brand bg-surface/90 px-3 py-1.5 text-xs font-medium text-muted shadow-sm backdrop-blur dark:bg-surface/80">
                <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent dark:text-accent-foreground">
                  Köpare och mäklare
                </span>
                <span className="text-foreground/80">
                  Enkel anmälan · lokal MVP · ingen inloggning ännu
                </span>
              </p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Berätta vilket boende du söker. Seriösa mäklare hör av sig.
              </h1>
              <p className="max-w-prose text-pretty text-base leading-7 text-muted">
                Söker du lägenhet i ett tufft marknadsläge? Beskriv budget och
                tidsplan en gång – mäklare som kan dina områden kan kontakta dig
                med relevanta objekt. Uppdragsgivare får efterfrågan som
                stämmer; du får svar som matchar{" "}
                <span className="font-medium text-foreground">ditt</span>{" "}
                intresse – inte bara allmänna tips om allt som finns i portföljen.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild>
                  <Link href="/buyer">Anmäl mitt köparintresse</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/agents-portal-123">Så använder mäklare tjänsten</Link>
                </Button>
              </div>
              <div className="grid gap-3 rounded-2xl border border-border-brand bg-surface p-5 text-sm text-muted shadow-sm dark:bg-surface/90">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent dark:bg-accent"
                  />
                  <p>
                    <strong className="font-medium text-foreground">Du</strong>:
                    Ange område, budget och tidsplan i ett flöde. Matchande
                    mäklare får ditt telefonnummer och mejl – inget meddelandefält
                    i appen i den här versionen; du bestämmer nästa steg.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent dark:bg-accent"
                  />
                  <p>
                    <strong className="font-medium text-foreground">
                      Mäklare och team
                    </strong>
                    : Filtrera köpare efter geografi och budget – och kontakta
                    personer som passar det du faktiskt är utsedd att sälja,
                    utan att köpa ännu en lead-lista med slump.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border-brand bg-surface p-6 shadow-[0_1px_3px_rgb(0_0_0/0.06)] dark:bg-surface/90 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent dark:text-accent-foreground">
                Förhandsvisning
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                Ditt intresseformulär – kort och tydligt
              </h2>
              <p className="mt-1 text-sm text-muted">
                Vi frågar bara om det viktigaste: kontaktuppgifter, områden,
                prisintervall, tidsplan och finansiering. Tar några minuter.
              </p>
              <div className="mt-6 grid gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-11 flex-1 rounded-xl bg-surface-subtle dark:bg-accent-soft/15" />
                  <div className="hidden h-11 w-28 rounded-xl bg-accent/10 sm:block" />
                </div>
                <div className="h-11 w-full rounded-xl bg-surface-subtle dark:bg-accent-soft/15" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-11 w-full rounded-xl bg-surface-subtle dark:bg-accent-soft/15" />
                  <div className="h-11 w-full rounded-xl bg-surface-subtle dark:bg-accent-soft/15" />
                </div>
                <div className="h-11 w-full rounded-xl bg-surface-subtle dark:bg-accent-soft/15" />
                <div className="flex items-center gap-2">
                  <div className="h-11 flex-1 rounded-xl bg-accent/15 dark:bg-accent/20" />
                </div>
              </div>
            </section>
          </div>
        </Container>
      </main>
    </div>
  );
}
