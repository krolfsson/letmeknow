import Link from "next/link";
import { Container } from "@/components/container";

export function SiteHeader() {
  return (
    <header className="shrink-0 border-b border-rule bg-bg/90">
      <Container className="flex h-12 items-center justify-center sm:h-14">
        <Link
          href="/"
          className="font-display text-[17px] font-semibold tracking-tight text-fg"
        >
          knowwhatiwant
        </Link>
      </Container>
    </header>
  );
}
