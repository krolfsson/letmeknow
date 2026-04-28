import Link from "next/link";
import { Container } from "@/components/container";

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-fg">
          Vet vad jag vill
        </Link>
        <Link
          href="/agents-portal-123"
          className="text-sm text-subtle transition-colors hover:text-fg"
        >
          Mäklare →
        </Link>
      </Container>
    </header>
  );
}
