/**
 * PageOpis — kratak opis (2–3 rečenice) ispod naslova stranice:
 * "za šta služi i šta tu mogu da uradim". Pomaže novom korisniku da
 * razume na šta je naišao.
 */
export default function PageOpis({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-kolo-muted max-w-2xl -mt-1">
      {children}
    </p>
  );
}
