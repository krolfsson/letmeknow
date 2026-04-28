import Link from "next/link";
import { Container } from "@/components/container";
import { FlowTimeline } from "@/components/flow-timeline";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="pb-16 pt-20 sm:pb-20 sm:pt-28">
          <Container>
            <h1 className="text-[2.6rem] font-semibold leading-[1.1] tracking-tight text-fg sm:text-6xl">
              Du vet redan
              <br />
              vad du vill ha.
            </h1>
            <p className="mt-5 max-w-sm text-lg leading-relaxed text-subtle sm:text-xl">
              Beskriv det en gång. Mäklare som passar hör av sig direkt.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button asChild>
                <Link href="/buyer">Anmäl dig</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/agents-portal-123">Jag är mäklare →</Link>
              </Button>
            </div>
          </Container>
        </section>

        {/* Timeline */}
        <section className="border-t border-rule pb-24 pt-16">
          <Container>
            <p className="mb-10 text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Hur det funkar
            </p>
            <FlowTimeline />
          </Container>
        </section>
      </main>
    </div>
  );
}
