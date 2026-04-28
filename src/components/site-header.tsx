import Link from "next/link";
import { Container } from "@/components/container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-brand bg-surface/80 backdrop-blur-md dark:bg-surface/70">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-baseline gap-2 font-semibold tracking-tight text-foreground">
          <span className="truncate">Know what I want</span>
          <span className="hidden rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent sm:inline dark:text-accent-foreground/90">
            Beta
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-sm text-muted">
          <Link
            href="/buyer"
            className="rounded-lg px-3 py-2 font-medium text-foreground transition-colors hover:bg-surface-subtle"
          >
            I’m buying
          </Link>
          <Link
            href="/agents-portal-123"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-surface-subtle"
          >
            For agents
          </Link>
        </nav>
      </Container>
    </header>
  );
}
