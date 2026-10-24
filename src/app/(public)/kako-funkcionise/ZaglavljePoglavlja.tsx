/**
 * Zaglavlje jednog poglavlja stranice „Kako funkcioniše". Stranica je od
 * 22.10.2026 jedna celina od četiri poglavlja (odluka vlasnika), pa poglavlje
 * nosi sidro (`id`) na koje vode i preusmerene stare adrese
 * (`/kako-sistem-radi`, `/o-nama`, `/o-sistemu`, `/pravna-pozicija`).
 * `scroll-mt` drži naslov ispod zaglavlja sajta kad se skoči na sidro.
 * Oznaka (pilula) je neobavezna: od 23.10.2026 nosi je samo pravno poglavlje
 * („Za regulatore, pravnike i novinare"), jer kaže kome je namenjeno.
 */
export default function ZaglavljePoglavlja({
  id,
  oznaka,
  naslov,
  opis,
}: {
  id: string;
  oznaka?: string;
  naslov: string;
  opis?: string;
}) {
  return (
    <header id={id} className="scroll-mt-24 bg-kolo-green-900 rounded-kartica px-6 md:px-8 py-8 text-white">
      {oznaka && (
        <div className="inline-block bg-white/10 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 tracking-wide uppercase">
          {oznaka}
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">{naslov}</h2>
      {opis && <p className="text-white/70 text-base md:text-lg mt-2">{opis}</p>}
    </header>
  );
}
