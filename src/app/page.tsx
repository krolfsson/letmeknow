import { HeroSection } from "@/components/hero-section";

export default async function Home() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#ffffff] to-[#f7fdfc]">
      <main>
        <HeroSection />
      </main>
    </div>
  );
}
