import { ImageResponse } from "next/og";

/**
 * Dinamička Open Graph slika (1200×630) — prikazuje se kad se sajt deli na
 * društvenim mrežama. Next.js je automatski servira na /opengraph-image.
 *
 * Font Inter (latin-ext) se učitava lokalno radi pune srpske latinice
 * (č/ć/š/ž/đ). `new URL(..., import.meta.url)` natera Next da bundluje .woff
 * kao asset, pa radi i u serverless i u edge okruženju.
 */
export const runtime = "edge";
// Alt čitaju čitači ekrana i pretraga. Nosi definiciju („sistem uzajamnosti"),
// ali NE prepisuje tagline sa same slike — opisuje šta se na njoj vidi, pa ko
// sliku ne vidi dobija isto obaveštenje, a ne dva puta istu rečenicu.
export const alt = "KOLO — sistem uzajamnosti za razmenu rada, dobara i znanja";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [interRegular, interBold] = await Promise.all([
    fetch(new URL("./_fonts/Inter-400.woff", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./_fonts/Inter-700.woff", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "linear-gradient(135deg, #0F3D20 0%, #1B6B3A 100%)",
          color: "#FAFAF8",
          fontFamily: "Inter",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Kružni motiv (kolo) — dekorativni prstenovi, simetrično po uglovima */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-160px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            border: "40px solid rgba(245, 184, 66, 0.18)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            left: "-160px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            border: "32px solid rgba(46, 157, 84, 0.35)",
            display: "flex",
          }}
        />

        {/* Sav sadržaj stoji u središnjem kvadratu (~600 px širine): Facebook
            u komentarima i na mobilnom seče 1200×630 na kvadrat iz sredine,
            pa sve levo poravnato ispada iz kadra. */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#F5B842",
              display: "flex",
            }}
          />
          <span style={{ fontSize: "26px", letterSpacing: "7px", color: "#E8F5EC", fontWeight: 700 }}>
            ZAJEDNIČKO DOBRO
          </span>
        </div>

        <div
          style={{
            fontSize: "176px",
            fontWeight: 700,
            letterSpacing: "-4px",
            lineHeight: 1,
            marginTop: "28px",
            display: "flex",
          }}
        >
          KOLO
        </div>
        <div
          style={{
            fontSize: "36px",
            marginTop: "24px",
            color: "#E8F5EC",
            maxWidth: "600px",
            lineHeight: 1.3,
            display: "flex",
            justifyContent: "center",
          }}
        >
          Sistem uzajamnosti zasnovan na doprinosu zajedničkom dobru
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginTop: "40px",
            fontSize: "28px",
          }}
        >
          <span style={{ color: "#F5B842", fontWeight: 700 }}>ekolo.rs</span>
          <span style={{ color: "rgba(232, 245, 236, 0.5)" }}>·</span>
          <span style={{ color: "#E8F5EC" }}>Članstvo je besplatno</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interBold, weight: 700, style: "normal" },
      ],
    },
  );
}
