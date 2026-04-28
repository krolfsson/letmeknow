import Link from "next/link";
import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function AgentsPortalPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col justify-center pb-14 pt-10">
        <Container className="max-w-xl">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-green">
            Mäklare
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-fg">
            Listan nästa release.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-subtle">
            Köpare lämnar sina signaler här på knowwhatiwant; du kopplar filtren
            mot dina sälj och plockar de hetaste först — hemlig URL tills vidare,
            ingen inloggningskö.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button variant="primary" asChild>
              <Link href="/buyer">Se köparsidan</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/">Till startsidan</Link>
            </Button>
          </div>
        </Container>
      </main>
    </div>
  );
}
