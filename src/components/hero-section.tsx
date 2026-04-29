import Link from "next/link";
import { Check } from "lucide-react";
import { SoftDivider } from "@/components/soft-divider";

const benefits = [
  {
    oldWay: "Hitta mäklare",
    newWay: "Mäklare hittar dig",
  },
  {
    oldWay: "Jaga objekt",
    newWay: "Få dem innan marknaden",
  },
  {
    oldWay: "Osäkra spekulanter",
    newWay: "Riktiga köpare",
  },
];

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-white to-green-50/40 pb-16 md:pb-24">
      <div className="mx-auto w-full px-4">
        <div className="mt-[1.875rem] flex justify-center">
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

        <div className="mt-6">
          <SoftDivider />
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl">
          <div className="pointer-events-none absolute inset-0 flex -translate-y-8 justify-center">
            <div className="h-[300px] w-[600px] rounded-full bg-emerald-400/15 opacity-40 blur-3xl" />
          </div>

          <div className="relative rounded-2xl border border-white/40 bg-white/80 px-6 py-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06)] ring-1 ring-white/50 backdrop-blur-md [animation:fade-in_400ms_ease-out_forwards] sm:px-10 sm:py-12">
            <h1 className="mx-auto max-w-[22ch] text-3xl font-semibold tracking-tight text-gray-900 [animation:fade-in_0.2s_ease-out_both] md:text-5xl">
              Få bostäder innan de når marknaden.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Berätta vad som spelar roll för dig – stadsdel, gata, port,
              väderstreck eller bara rätt ambiance. När rätt hem dyker upp vet
              mäklaren att du letar.
            </p>

            <div className="mx-auto mt-8 w-full max-w-sm">
              <Link
                href="/buyer"
                className="flex h-14 w-full items-center justify-center rounded-xl bg-emerald-500 px-6 text-base font-semibold text-white shadow-[0_8px_25px_rgba(16,185,129,0.36)] transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-emerald-600 hover:shadow-[0_12px_35px_rgba(16,185,129,0.48)]"
              >
                Berätta hur du vill bo
              </Link>
              <Link
                href="/agents-portal-123"
                className="mt-3 inline-block text-sm text-gray-500 underline underline-offset-2 transition-colors duration-200 hover:text-indigo-600"
            >
              För mäklare
              </Link>
            </div>

            <div className="mt-10 flex flex-col items-center gap-4">
              {benefits.map((benefit, index) => (
                <p
                  key={benefit.oldWay}
                  className="flex items-center gap-2 text-base motion-safe:[animation:fade-in_400ms_ease-out_forwards] md:text-lg"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Check
                    className="h-4 w-4 stroke-[1.8] text-emerald-500 drop-shadow-[0_2px_6px_rgba(16,185,129,0.34)]"
                    aria-hidden
                  />
                  <span className="text-gray-400 line-through opacity-70">
                    {benefit.oldWay}
                  </span>
                  <span className="text-gray-900">-</span>
                  <span className="font-semibold text-gray-900">{benefit.newWay}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <SoftDivider />
        </div>
      </div>
    </section>
  );
}
