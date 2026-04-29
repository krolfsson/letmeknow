/** Låser horisontell scroll på mobil så range-staplar och layout inte “drar” sidan i sidled. */
export default function BuyerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh min-w-0 overflow-x-hidden">
      {children}
    </div>
  );
}
