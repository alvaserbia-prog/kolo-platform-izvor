// Ključ za grupisanje lokacija članova po mestu. Bez importa — čita ga i
// pretraživač (`LokacijeSekcija`) i server (brojač ka prvoj zadruzi na naslovnoj),
// da isto mesto na dva ekrana ne bi imalo dva različita broja (pravilo 14).

// Normalizuje slobodan tekst lokacije u ključ za grupisanje (trim, sažimanje
// razmaka, mala slova). Vraća "" za praznu/nepostojeću lokaciju.
export function normalizujLokaciju(sirovo: string | null): string {
  if (!sirovo) return "";
  const ociscen = sirovo.trim().replace(/\s+/g, " ");
  // NAMERNO fiksna srpska latinica: ovo je normalizacija za grupisanje
  // lokacija, ne prikaz. Da zavisi od jezika posmatrača, isti gradovi bi
  // se različito grupisali Srbinu i Rusu.
  return ociscen ? ociscen.toLocaleLowerCase("sr-Latn-RS") : "";
}
