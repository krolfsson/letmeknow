import Link from "next/link";
import { SoftDivider } from "@/components/soft-divider";

export function SiteHeader() {
  return (
    <header className="shrink-0 px-4 pt-[1.875rem]">
      <div className="mb-6 flex justify-center">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-0.5 text-4xl font-semibold tracking-[-0.04em] text-gray-950 opacity-95 transition-opacity hover:opacity-100 sm:text-[2.55rem]"
        >
          <span>want</span>
          <span className="text-emerald-600 transition-colors group-hover:text-indigo-600">
            i
          </span>
        </Link>
      </div>
      <SoftDivider />
    </header>
  );
}
