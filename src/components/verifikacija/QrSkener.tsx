"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Html5Qrcode } from "html5-qrcode";

/**
 * Skener QR kodova preko kamere uređaja.
 * Radi na desktopu i mobilnom (Chrome, Safari, Firefox).
 * Default: zadnja kamera ("environment") — na mobilnom uobičajeno glavna.
 */
type Props = {
  onDetektovan: (token: string) => void;
  onZatvori: () => void;
  /** Uputstvo ispod skenera. Podrazumevano: verifikacija. */
  uputstvo?: string;
};

const SKENER_REGION_ID = "kolo-qr-skener-region";

export default function QrSkener({ onDetektovan, onZatvori, uputstvo }: Props) {
  const t = useTranslations("verifikacija");
  const [error, setError] = useState<string | null>(null);
  const [aktivnaKamera, setAktivnaKamera] = useState<"environment" | "user">(
    "environment"
  );
  const skenerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let cancelled = false;

    // html5-qrcode (~200KB) se učitava LENJO — tek kad se skener montira (otvori),
    // a ne u glavnom bundle-u rute. Dinamički `import()` ga izdvaja u zaseban chunk.
    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (cancelled) return;
        const html5 = new Html5Qrcode(SKENER_REGION_ID);
        skenerRef.current = html5;

        return html5.start(
          { facingMode: aktivnaKamera },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (cancelled) return;
            cancelled = true;
            html5
              .stop()
              .catch(() => {})
              .finally(() => onDetektovan(decodedText.trim()));
          },
          () => {
            // ignore: ovo se zove često (jednom po frame-u kad nema match-a)
          }
        );
      })
      .then(() => {
        // Forsira video element da bude kvadratan — html5-qrcode generiše video
        // sa specifičnim dimenzijama, trebaju nam CSS override-i
        const container = document.getElementById(SKENER_REGION_ID);
        if (!container) return;
        const video = container.querySelector("video");
        const canvas = container.querySelector("canvas");
        if (video) {
          video.style.width = "100%";
          video.style.height = "100%";
          video.style.objectFit = "cover";
          video.style.display = "block";
        }
        if (canvas) {
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvas.style.display = "block";
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          msg.includes("NotAllowed") ||
          msg.includes("Permission") ||
          msg.includes("denied")
        ) {
          setError(
            t("skener_bez_dozvole")
          );
        } else if (msg.includes("NotFound") || msg.includes("NotReadable")) {
          setError(t("skener_nema_kamere"));
        } else {
          setError(`Greška kamere: ${msg}`);
        }
      });

    return () => {
      cancelled = true;
      const sk = skenerRef.current;
      if (sk && sk.isScanning) {
        sk.stop().catch(() => {});
      }
    };
  }, [aktivnaKamera, onDetektovan, t]);

  function preokreni() {
    setAktivnaKamera((c) => (c === "environment" ? "user" : "environment"));
  }

  return (
    <div className="space-y-3">
      <div
        id={SKENER_REGION_ID}
        className="w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-black"
        style={{ aspectRatio: "1 / 1" }}
      />
      {error && (
        <div role="alert" className="text-sm text-kolo-danger bg-kolo-danger-light border border-kolo-danger-light rounded-xl p-3">
          {error}
        </div>
      )}
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={preokreni}
          className="px-3 py-1.5 rounded-xl bg-kolo-bg hover:bg-kolo-green-100 text-sm font-medium"
        >
          Preokreni kameru ({aktivnaKamera === "environment" ? "zadnja" : "prednja"})
        </button>
        <button
          type="button"
          onClick={onZatvori}
          className="px-3 py-1.5 rounded-xl bg-kolo-bg hover:bg-kolo-green-100 text-sm font-medium"
        >
          Zatvori skener
        </button>
      </div>
      <p className="text-xs text-kolo-muted text-center">
        {uputstvo ?? t("skener_uputstvo")}
      </p>
    </div>
  );
}
