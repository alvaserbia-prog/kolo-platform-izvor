// Pseudonim se NIKAD ne transliteriše u ćirilicu — vlastito ime/handle korisnika
// ostaje u izvornom (latiničnom) obliku da ne bi izgledao izmešano (npr.
// „NoxuzTech" → „НоxузТецх"). `data-no-cyr` signalizira CirilicaProvider-u da
// preskoči sadržaj (vidi src/components/CirilicaProvider.tsx).
//
// Koristi se svuda gde se prikazuje korisnički pseudonim:
//   <Pseudonim>{korisnik.pseudonim}</Pseudonim>
// Renderuje se kao <span>, pa staje u tekst tokove (linkovi, tabele, naslovi…).

export default function Pseudonim({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span data-no-cyr className={className}>
      {children}
    </span>
  );
}
