"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, CircleMarker, LayerGroup } from "leaflet";

export type TackaGazdinstva = {
  id: string;
  naziv: string;
  naselje: string;
  lat: number;
  lng: number;
  brojOglasa?: number;
};

/** Centar Srbije — početni pogled kad nema tačaka. */
const SRBIJA: [number, number] = [44.2, 20.9];

/**
 * Mapa domaćih proizvođača (Pravilnik o gazdinstvima čl. 19).
 *
 * Dva režima:
 *  - prikaz: tačke odobrenih gazdinstava, klik vodi na profil;
 *  - izbor: jedna tačka koju korisnik postavlja klikom (prijava gazdinstva).
 *
 * 🔴 Adresa se nigde ne ispisuje — ni u oblačiću ni u naslovu tačke. Vidi se
 * tačka na podlozi, a uz nju samo naziv i naselje. Tačke su krugovi, ne ikonice,
 * pa nema slika koje bi se tražile sa strane.
 *
 * Leaflet se učitava tek u pretraživaču (pristupa `window`), zato dinamički uvoz.
 */
export default function MapaGazdinstava({
  tacke = [],
  izbor,
  onIzbor,
  centar,
  zumCentra = 14,
  visina = 420,
  tekstOglasa,
}: {
  tacke?: TackaGazdinstva[];
  /** Režim izbora: trenutno izabrana tačka (ili null). */
  izbor?: { lat: number; lng: number } | null;
  onIzbor?: (t: { lat: number; lng: number }) => void;
  /** Gde da se mapa centrira (npr. izabrano naselje). */
  centar?: [number, number] | null;
  /** Zum pri centriranju — za naselje šire, za pronađenu adresu bliže. */
  zumCentra?: number;
  visina?: number;
  /** Tekst uz broj oglasa u oblačiću, npr. (n) => `${n} oglasa`. */
  tekstOglasa?: (n: number) => string;
}) {
  const kontejner = useRef<HTMLDivElement>(null);
  const tMapa = useTranslations("common");
  const [zakljucana, setZakljucana] = useState(false);
  const mapa = useRef<LeafletMap | null>(null);
  const sloj = useRef<LayerGroup | null>(null);
  const izabrana = useRef<CircleMarker | null>(null);
  const onIzborRef = useRef(onIzbor);
  useEffect(() => {
    onIzborRef.current = onIzbor;
  }, [onIzbor]);

  // Inicijalizacija — jednom.
  useEffect(() => {
    let otkazano = false;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (otkazano || !kontejner.current || mapa.current) return;
      // Točkić zumira kad je kursor nad mapom (odluka vlasnika, 18.10.2026) — bez
      // klikanja na plus i minus. Van mape točkić i dalje pomera stranicu.
      // Na dodirnom ekranu mapa se ne pomera jednim prstom dok je čovek ne
      // dodirne — inače hvata prevlačenje i stranica se preko nje ne skroluje.
      const dodir = window.matchMedia("(pointer: coarse)").matches;
      const m = L.map(kontejner.current, { scrollWheelZoom: true, wheelPxPerZoomLevel: 80, dragging: !dodir }).setView(SRBIJA, 7);
      if (dodir) {
        setZakljucana(true);
        m.once("click", () => {
          m.dragging.enable();
          setZakljucana(false);
        });
      }
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      sloj.current = L.layerGroup().addTo(m);
      m.on("click", (e) => {
        onIzborRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      mapa.current = m;
      // Prvo iscrtavanje tačaka posle učitavanja.
      kontejner.current.dispatchEvent(new Event("mapa-spremna"));
    })();
    return () => {
      otkazano = true;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  // Tačke gazdinstava.
  useEffect(() => {
    const crtaj = async () => {
      const L = (await import("leaflet")).default;
      const m = mapa.current;
      if (!m || !sloj.current) return;
      sloj.current.clearLayers();
      for (const t of tacke) {
        const oblacic = document.createElement("div");
        const a = document.createElement("a");
        a.href = `/gazdinstva/${t.id}`;
        a.textContent = t.naziv;
        a.style.fontWeight = "600";
        oblacic.appendChild(a);
        const p = document.createElement("div");
        p.textContent =
          t.naselje + (t.brojOglasa !== undefined && tekstOglasa ? ` · ${tekstOglasa(t.brojOglasa)}` : "");
        oblacic.appendChild(p);
        L.circleMarker([t.lat, t.lng], {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#2f6b3a",
          fillOpacity: 0.95,
        })
          .bindPopup(oblacic)
          .addTo(sloj.current);
      }
      if (tacke.length > 0 && !izbor) {
        const granice = L.latLngBounds(tacke.map((t) => [t.lat, t.lng] as [number, number]));
        m.fitBounds(granice, { padding: [30, 30], maxZoom: 13 });
      }
    };
    void crtaj();
    const el = kontejner.current;
    const naSpremno = () => void crtaj();
    el?.addEventListener("mapa-spremna", naSpremno);
    return () => el?.removeEventListener("mapa-spremna", naSpremno);
  }, [tacke, izbor, tekstOglasa]);

  // Izabrana tačka (režim izbora).
  useEffect(() => {
    const crtaj = async () => {
      const L = (await import("leaflet")).default;
      const m = mapa.current;
      if (!m) return;
      izabrana.current?.remove();
      izabrana.current = null;
      if (izbor) {
        izabrana.current = L.circleMarker([izbor.lat, izbor.lng], {
          radius: 10,
          color: "#ffffff",
          weight: 3,
          fillColor: "#b8862b",
          fillOpacity: 1,
        }).addTo(m);
      }
    };
    void crtaj();
    const el = kontejner.current;
    const naSpremno = () => void crtaj();
    el?.addEventListener("mapa-spremna", naSpremno);
    return () => el?.removeEventListener("mapa-spremna", naSpremno);
  }, [izbor]);

  // Centriranje na izabrano naselje.
  useEffect(() => {
    if (!centar) return;
    const m = mapa.current;
    if (m) m.setView(centar, zumCentra);
    const el = kontejner.current;
    const naSpremno = () => mapa.current?.setView(centar, zumCentra);
    el?.addEventListener("mapa-spremna", naSpremno);
    return () => el?.removeEventListener("mapa-spremna", naSpremno);
  }, [centar, zumCentra]);

  return (
    <div className="relative">
      <div
        ref={kontejner}
        className="w-full rounded-kartica border border-kolo-border overflow-hidden z-0"
        style={{ height: `min(${visina}px, 55vh)` }}
      />
      {zakljucana && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 z-[500] mx-auto w-max max-w-[90%] rounded-full bg-kolo-text/80 px-3 py-1.5 text-center text-xs font-medium text-white">
          {tMapa("mapa_dodirni")}
        </p>
      )}
    </div>
  );
}
