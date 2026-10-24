// Nalozi Fondacije na društvenim mrežama — JEDINO mesto sa adresama; i podnožje
// i naslovna uzimaju ovu komponentu, da se adresa ne prepisuje na dva mesta.
//
// 🔴 Samo obični linkovi. Nikakav ugrađen sadržaj (Like dugme, feed, embed,
// piksel): to su skripte trećih lica koje prenose podatke posetioca u SAD, a
// Politika i DPIA taj prenos ne predviđaju (R-12). Običan link ne šalje ništa
// dok posetilac sam ne klikne.
//
// Nazivi mreža su vlastita imena i ne prevode se, pa `aria-label` ne ide kroz
// `messages/`.

const MREZE = [
  {
    naziv: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61588239821039",
    ikona: (
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.55V4.63A20.6 20.6 0 0 0 14.25 4.5c-2.24 0-3.77 1.37-3.77 3.88v2.18H7.94v2.94h2.54V21h3.02Z" />
    ),
  },
  {
    naziv: "Instagram",
    href: "https://www.instagram.com/ekolo_rs/",
    ikona: (
      <path
        fillRule="evenodd"
        d="M12 3c-2.44 0-2.75.01-3.71.05-.96.05-1.61.2-2.18.42a4.4 4.4 0 0 0-1.6 1.04 4.4 4.4 0 0 0-1.04 1.6c-.22.57-.37 1.22-.42 2.18C3.01 9.25 3 9.56 3 12s.01 2.75.05 3.71c.05.96.2 1.61.42 2.18.23.59.54 1.1 1.04 1.6.5.5 1.01.81 1.6 1.04.57.22 1.22.37 2.18.42.96.04 1.27.05 3.71.05s2.75-.01 3.71-.05c.96-.05 1.61-.2 2.18-.42a4.4 4.4 0 0 0 1.6-1.04c.5-.5.81-1.01 1.04-1.6.22-.57.37-1.22.42-2.18.04-.96.05-1.27.05-3.71s-.01-2.75-.05-3.71c-.05-.96-.2-1.61-.42-2.18a4.4 4.4 0 0 0-1.04-1.6 4.4 4.4 0 0 0-1.6-1.04c-.57-.22-1.22-.37-2.18-.42C14.75 3.01 14.44 3 12 3Zm0 1.62c2.4 0 2.69.01 3.64.05.88.04 1.35.19 1.67.31.42.16.72.36 1.03.67.32.32.51.62.67 1.03.12.32.27.8.31 1.67.04.95.05 1.24.05 3.65s-.01 2.69-.05 3.64c-.04.88-.19 1.35-.31 1.67-.16.42-.36.72-.67 1.03-.32.32-.62.51-1.03.67-.32.12-.8.27-1.67.31-.95.04-1.24.05-3.64.05s-2.7-.01-3.65-.05c-.88-.04-1.35-.19-1.67-.31a2.8 2.8 0 0 1-1.03-.67 2.8 2.8 0 0 1-.67-1.03c-.12-.32-.27-.8-.31-1.67-.04-.95-.05-1.24-.05-3.64s.01-2.7.05-3.65c.04-.88.19-1.35.31-1.67.16-.42.36-.72.67-1.03.32-.32.62-.51 1.03-.67.32-.12.8-.27 1.67-.31.95-.04 1.24-.05 3.65-.05Zm0 2.76a4.62 4.62 0 1 0 0 9.24 4.62 4.62 0 0 0 0-9.24ZM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.88-7.8a1.08 1.08 0 1 1-2.16 0 1.08 1.08 0 0 1 2.16 0Z"
      />
    ),
  },
  {
    naziv: "TikTok",
    href: "https://www.tiktok.com/@ekolo.rs",
    ikona: (
      <path d="M16.6 3h-3.1v12.3a2.7 2.7 0 1 1-2.7-2.7c.28 0 .55.04.8.12V9.56a5.85 5.85 0 1 0 5 5.79V9.1a7.3 7.3 0 0 0 4.1 1.26V7.27A4.13 4.13 0 0 1 16.6 3Z" />
    ),
  },
] as const;

export default function DrustveneMreze({ tema = "svetla" }: { tema?: "svetla" | "tamna" }) {
  const boja =
    tema === "tamna"
      ? "text-white/85 hover:text-white hover:bg-white/10"
      : "text-kolo-muted hover:text-kolo-green-700 hover:bg-kolo-green-700/5";

  return (
    <ul className="flex items-center gap-1">
      {MREZE.map((m) => (
        <li key={m.naziv}>
          <a
            href={m.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={m.naziv}
            title={m.naziv}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${boja}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {m.ikona}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
