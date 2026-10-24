import type { EkranTekst } from "@/lib/ekran-poruke";

/**
 * Zajednički izgled sistemskih ekrana (pad sistema, održavanje, 404).
 *
 * ⚠️ SVE JE INLINE STIL, NAMERNO — bez Tailwind klasa, bez `next/image`,
 * bez `next/link`, bez i18n providera. Ovaj ekran se prikazuje i kroz
 * `global-error.tsx`, koji zamenjuje ceo `RootLayout` — tada `globals.css`
 * (uvezen u layout-u) ne mora da bude na stranici, pa bi Tailwind klase bile
 * prazne i korisnik bi video neoblikovan tekst. Inline stil radi uvek.
 *
 * Isti razlog i za `<img>` umesto `next/image`: optimizator slika je serverska
 * funkcija, a ovaj ekran mora da izgleda ispravno i kad serverski deo ne radi.
 * `/kolo-logo.png` je statički fajl sa CDN-a i stiže nezavisno od aplikacije.
 */

type Props = {
  tekst: EkranTekst;
  /** Radnja glavnog dugmeta (reset boundary / reload). Bez nje se dugme ne prikazuje. */
  naDugme?: () => void;
  /** Tehnička oznaka greške (Next `digest`) — pomaže pri prijavi problema. */
  oznakaGreske?: string;
};

const ZELENA_TAMNA = "#0F3D20";
const ZELENA = "#1B6B3A";
const ZLATNA = "#D99520";
const POZADINA = "#FAFAF8";
const IVICA = "#E8E6E1";
const PRIGUSENO = "#6B6860";

export function SistemskiEkran({ tekst, naDugme, oznakaGreske }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
        background: POZADINA,
        backgroundImage:
          "radial-gradient(circle at 50% 0%, #E8F5EC 0%, rgba(232,245,236,0) 55%), radial-gradient(circle, #DEDCD6 1px, transparent 1px)",
        backgroundSize: "100% 620px, 22px 22px",
        backgroundRepeat: "no-repeat, repeat",
        color: "#1A1A17",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", system-ui, sans-serif',
      }}
    >
      <style>{`
        @keyframes kolo-puls {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: .35; transform: scale(.82); }
        }
        @media (prefers-reduced-motion: reduce) {
          .kolo-tacka { animation: none !important; }
        }
        .kolo-dugme:hover { background: ${ZELENA_TAMNA} !important; }
        .kolo-link:hover  { color: ${ZELENA_TAMNA} !important; }
      `}</style>

      <main
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#FFFFFF",
          border: `1px solid ${IVICA}`,
          borderRadius: "24px",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(15,61,32,0.07), 0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* `kolo-icon.png`, ne `kolo-logo.png`: logo ima belu podlogu ubačenu u
            sam PNG, koja se na beloj kartici vidi kao siv pravougaonik. Ikonica
            ima providne uglove, pa seda čisto. Natpis „KOLO" je tekst. */}
        <img
          src="/kolo-icon.png"
          alt=""
          width={60}
          height={57}
          style={{ display: "block", margin: "0 auto 10px", width: "60px", height: "auto" }}
        />
        <div
          style={{
            marginBottom: "22px",
            fontSize: "17px",
            fontWeight: 800,
            letterSpacing: "0.18em",
            color: ZELENA_TAMNA,
          }}
        >
          KOLO
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            marginBottom: "20px",
            borderRadius: "999px",
            background: "#FDF4E0",
            color: "#8A5A00",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <span
            className="kolo-tacka"
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "999px",
              background: ZLATNA,
              animation: "kolo-puls 1.8s ease-in-out infinite",
            }}
          />
          {tekst.oznaka}
        </div>

        <h1
          style={{
            margin: "0 0 14px",
            fontSize: "26px",
            lineHeight: 1.25,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: ZELENA_TAMNA,
          }}
        >
          {tekst.naslov}
        </h1>

        <p style={{ margin: "0 0 10px", fontSize: "16px", lineHeight: 1.6, color: "#3A3A34" }}>
          {tekst.telo}
        </p>
        <p style={{ margin: "0 0 28px", fontSize: "15px", lineHeight: 1.6, color: PRIGUSENO }}>
          {tekst.dopuna}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {naDugme && tekst.dugme ? (
            <button
              type="button"
              onClick={naDugme}
              className="kolo-dugme"
              style={{
                appearance: "none",
                border: "none",
                cursor: "pointer",
                padding: "12px 24px",
                borderRadius: "12px",
                background: ZELENA,
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                fontFamily: "inherit",
                transition: "background 150ms ease",
              }}
            >
              {tekst.dugme}
            </button>
          ) : null}
          <a
            href="/"
            className="kolo-link"
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border: `1px solid ${IVICA}`,
              color: ZELENA,
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "color 150ms ease",
            }}
          >
            {tekst.pocetna}
          </a>
        </div>

        <p
          style={{
            margin: "28px 0 0",
            paddingTop: "20px",
            borderTop: `1px solid ${IVICA}`,
            fontSize: "12px",
            color: PRIGUSENO,
          }}
        >
          KOLO Fondacija · ekolo.rs
          {oznakaGreske ? (
            <>
              <br />
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {oznakaGreske}
              </span>
            </>
          ) : null}
        </p>
      </main>
    </div>
  );
}
