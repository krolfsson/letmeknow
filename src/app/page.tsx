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
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
            <section className="space-y-5">
              <p className="inline-flex w-fit max-w-full flex-wrap items-center gap-2 rounded-full border border-border-brand bg-surface/90 px-3 py-1.5 text-xs font-medium text-muted shadow-sm backdrop-blur dark:bg-surface/80">
                <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent dark:text-accent-foreground">
                  Buyers & agents
                </span>
                <span className="text-foreground/80">
                  Straightforward signup · Local MVP · No login yet
                </span>
              </p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Tell us what home you&apos;re after. Serious agents reply.
              </h1>
              <p className="max-w-prose text-pretty text-base leading-7 text-muted">
                Looking to buy a place in Sweden&apos;s tighter market?
                Describe your budget and timing once — brokers who cover your areas
                can reach you with real listings. Sellers&apos; reps get qualified
                demand; you get replies that match{" "}
                <span className="font-medium text-foreground">your</span>{" "}
                intent, not random cold calls about everything on their books.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild>
                  <Link href="/buyer">Add my buyer interest</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/agents-portal-123">See how agents use this</Link>
                </Button>
              </div>
              <div className="grid gap-3 rounded-2xl border border-border-brand bg-surface p-5 text-sm text-muted shadow-sm dark:bg-surface/90">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent dark:bg-accent"
                  />
                  <p>
                    <strong className="font-medium text-foreground">You</strong>
                    : Share area, budget, and timeline in one flow. Matching agents
                    get your phone and email —{" "}
                    <span className="font-medium text-foreground">no inbox</span>{" "}
                    inside this app for now; you stay in charge of next steps.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent dark:bg-accent"
                  />
                  <p>
                    <strong className="font-medium text-foreground">
                      Agents & teams
                    </strong>
                    : Scan buyers by geography and budget — then contact people
                    who actually fit what you&apos;re mandated to sell, without
                    buying another lead list lottery ticket.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border-brand bg-surface p-6 shadow-[0_1px_3px_rgb(0_0_0/0.06)] dark:bg-surface/90 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent dark:text-accent-foreground">
                Sneak peek
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                Your interest form — short and clear
              </h2>
              <p className="mt-1 text-sm text-muted">
                We&apos;ll ask for essentials only: contacts, neighbourhoods,
                range, timeline, financing. Takes a couple of minutes.
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
