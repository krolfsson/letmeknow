export function SoftDivider() {
  return (
    <div
      className="relative mx-auto h-px w-full max-w-5xl bg-gradient-to-r from-transparent via-gray-300/70 to-transparent after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-emerald-400/25 after:to-transparent after:blur-sm after:content-['']"
      aria-hidden
    />
  );
}
