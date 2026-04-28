import Link from "next/link";
import { Container } from "@/components/container";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />

      <main className="flex min-h-[calc(100dvh-3rem)] flex-1 flex-col justify-center sm:min-h-[calc(100dvh-3.5rem)]">
        <Container className="max-w-xl">
          <p className="font-display text-base font-semibold leading-snug text-green sm:text-lg">
            knowwhatiwant kopplar köpare som beskriver vad de vill bo ihop med
            mäklare som letar säljbara, superrelevanta leads.
          </p>

          <h1 className="font-display mt-5 text-[2.1rem] font-bold leading-[1.05] tracking-tight text-fg sm:text-5xl">
            Specifik gata,{" "}
            <span className="italic text-green-deep dark:text-green">ett hus,</span>
            <br />eller bara känslan av rätt stadsdel.
          </h1>

          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-subtle sm:text-base">
            Du kan vara löjligt nischad eller brett målande — båda funkar. Mäklare
            ser vad du är ute efter och kan hugga direkt på det som kokar mest i
            just deras böcker.
          </p>

          <div className="mt-10 grid w-full gap-3 sm:grid-cols-2 sm:gap-4">
            <Button variant="primary" asChild>
              <Link href="/buyer">Jag är köpare</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/agents-portal-123">Jag är mäklare</Link>
            </Button>
          </div>
        </Container>
      </main>
    </div>
  );
}
