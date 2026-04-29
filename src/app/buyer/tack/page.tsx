import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { TackInner } from "./tack-inner";

/** Kvittens efter formulärskick — läser `?id=` från API-svaret */
export default function BuyerTackPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-white to-green-50/40">
      <SiteHeader />
      <Suspense
        fallback={
          <main className="flex flex-col items-center px-6 py-24 text-gray-500">
            Laddar…
          </main>
        }
      >
        <TackInner />
      </Suspense>
    </div>
  );
}
