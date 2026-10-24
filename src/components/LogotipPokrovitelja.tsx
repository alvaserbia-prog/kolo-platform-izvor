/**
 * Logotip pokrovitelja uz naziv (Pravilnik o pokroviteljstvu i donacijama čl. 13
 * st. 4): na rang-listi, na vaučerima i uz ponudu vaučera.
 *
 * 🔴 Samo slika — nikad link (`<a>`, `href`, `onClick`). Pokrovitelj ne stiče pravo
 * na upućivanje na svoju internet stranicu (čl. 13 st. 5). Uz logotip ide samo
 * naziv; slogan, opis ni bilo šta drugo se ne prikazuju. Brana:
 * `__tests__/logotip-pokrovitelja-izvor.test.ts`.
 *
 * Bez hook-ova i bez `"use client"` — koriste ga i serverske i klijentske strane.
 */
export default function LogotipPokrovitelja({
  url,
  velicina = 40,
}: {
  url: string | null | undefined;
  velicina?: number;
}) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={velicina}
      height={velicina}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-lg border border-kolo-border bg-white object-contain"
      style={{ width: velicina, height: velicina }}
    />
  );
}
