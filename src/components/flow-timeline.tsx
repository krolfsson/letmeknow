const steps = [
  {
    n: "01",
    title: "Du fyller i vad du vill",
    buyer: "Område, bostadstyp, budget och när du vill flytta. Tar tre minuter.",
    agent: "Direkt synligt för mäklare som täcker dina områden.",
  },
  {
    n: "02",
    title: "Det hamnar på ett ställe",
    buyer: "Ingen inloggning. Inget konto. Du sparar och är klar.",
    agent: "En gemensam lista — inte tio lösa mejltrådar.",
  },
  {
    n: "03",
    title: "Rätt mäklare ser dig",
    buyer: "Du matchas mot mäklare som faktiskt jobbar dina kvarter.",
    agent: "Filtrera på geografi och budget — ring dem du kan hjälpa.",
  },
  {
    n: "04",
    title: "Kontakt på riktigt",
    buyer: "Svaret kommer via telefon eller mejl. Inga chattappar emellan.",
    agent: "Kopiera numret. Ring. Affär eller inte — men du vet vem det gäller.",
  },
];

export function FlowTimeline() {
  return (
    <ol className="relative border-l border-rule pl-8 space-y-10">
      {steps.map(({ n, title, buyer, agent }) => (
        <li key={n} className="relative">
          <span className="absolute -left-[41px] flex h-[18px] w-[18px] items-center justify-center rounded-full border border-rule bg-bg text-[9px] font-semibold tracking-wide text-subtle">
            {n}
          </span>
          <h3 className="text-base font-semibold text-fg">{title}</h3>
          <div className="mt-2.5 grid gap-2 text-sm text-subtle sm:grid-cols-2 sm:gap-4">
            <p>
              <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-green">
                Köpare
              </span>
              {buyer}
            </p>
            <p>
              <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-green">
                Mäklare
              </span>
              {agent}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
