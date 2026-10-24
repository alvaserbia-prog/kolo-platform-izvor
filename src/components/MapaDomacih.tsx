"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { grupisi, prikaziLabelu, pijacaHref, vauceriHref, type TackaMape } from "@/lib/mapa-pravila";

/** Centar Srbije — početni pogled kad nema tačaka. */
const SRBIJA: [number, number] = [44.2, 20.9];

export type TekstoviMape = {
  domace: string;
  pijaca: string;
  vauceri: (n: number) => string;
  nemaVaucera: string;
  preuzmi: string;
  prijaviSe: string;
  grupa: (n: number) => string;
};

/**
 * Jedna mapa za gazdinstva i pokrovitelje (Pravilnik o gazdinstvima čl. 11,
 * Pravilnik o pokroviteljstvu i donacijama čl. 13 st. 4).
 *
 * Dve vrste oznaka (gazdinstvo, pokrovitelj), grupisanje bliskih tačaka, naziv iznad
 * tačke tek od zuma `LABELA_OD_ZUMA`. Klik/dodir (i prelaz mišem na računaru)
 * otvara karticu: naziv (uz logotip pokrovitelja), oznaka DOMAĆE, mesto i adresa
 * (samo kad je data izjava — podatak već dolazi `null` bez nje), i najviše dve veze:
 * „Pijaca" (oglasi u ime gazdinstva) i „Vaučeri" (broj slobodnih + preuzimanje).
 *
 * 🔴 Na kartici nema „kupi", cene, POEN-a, BPG-a, MB-a, PIB-a ni imena. Sav tekst
 * iz podataka ide kroz `textContent`, nikad kao HTML.
 *
 * Leaflet se učitava tek u pretraživaču (pristupa `window`), zato dinamički uvoz.
 */
export default function MapaDomacih({
  tacke,
  prijavljen,
  tekstovi,
  visina = 460,
}: {
  tacke: TackaMape[];
  prijavljen: boolean;
  tekstovi: TekstoviMape;
  visina?: number;
}) {
  const kontejner = useRef<HTMLDivElement>(null);
  const tMapa = useTranslations("common");
  const [zakljucana, setZakljucana] = useState(false);
  const mapa = useRef<LeafletMap | null>(null);
  const sloj = useRef<LayerGroup | null>(null);
  const crtajRef = useRef<() => void>(() => {});

  // Inicijalizacija — jednom.
  useEffect(() => {
    let otkazano = false;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (otkazano || !kontejner.current || mapa.current) return;
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
      m.on("zoomend", () => crtajRef.current());
      mapa.current = m;
      kontejner.current.dispatchEvent(new Event("mapa-spremna"));
    })();
    return () => {
      otkazano = true;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  // Tačke, grupe i kartice.
  useEffect(() => {
    let prvoUklapanje = true;
    const kartica = (t: TackaMape): HTMLElement => {
      const el = document.createElement("div");
      el.style.minWidth = "180px";
      const glava = document.createElement("div");
      glava.style.display = "flex";
      glava.style.alignItems = "center";
      glava.style.gap = "8px";
      if (t.logoUrl) {
        const img = document.createElement("img");
        img.src = t.logoUrl;
        img.alt = "";
        img.width = 32;
        img.height = 32;
        img.referrerPolicy = "no-referrer";
        img.style.objectFit = "contain";
        img.style.borderRadius = "6px";
        glava.appendChild(img);
      }
      const naziv = document.createElement("strong");
      naziv.textContent = t.naziv;
      glava.appendChild(naziv);
      el.appendChild(glava);
      if (t.domace) {
        const d = document.createElement("div");
        d.textContent = tekstovi.domace;
        d.style.fontSize = "11px";
        d.style.fontWeight = "700";
        d.style.color = "#2f6b3a";
        d.style.marginTop = "4px";
        el.appendChild(d);
      }
      const mesto = document.createElement("div");
      mesto.textContent = t.adresa ? `${t.mesto}, ${t.adresa}` : t.mesto;
      mesto.style.marginTop = "4px";
      el.appendChild(mesto);
      const veze = document.createElement("div");
      veze.style.display = "flex";
      veze.style.flexWrap = "wrap";
      veze.style.gap = "10px";
      veze.style.marginTop = "6px";
      const ph = pijacaHref(t);
      if (ph) {
        const a = document.createElement("a");
        a.href = ph;
        a.textContent = tekstovi.pijaca;
        veze.appendChild(a);
      }
      const vh = vauceriHref(t);
      if (vh) {
        const v = document.createElement("div");
        if (t.vauceri > 0) {
          const broj = document.createElement("span");
          broj.textContent = `${tekstovi.vauceri(t.vauceri)} · `;
          v.appendChild(broj);
          const a = document.createElement("a");
          a.href = prijavljen ? vh : `/login?callbackUrl=${encodeURIComponent(vh)}`;
          a.textContent = prijavljen ? tekstovi.preuzmi : tekstovi.prijaviSe;
          v.appendChild(a);
        } else {
          v.textContent = tekstovi.nemaVaucera;
        }
        veze.appendChild(v);
      }
      if (veze.childNodes.length > 0) el.appendChild(veze);
      return el;
    };

    const crtaj = async () => {
      const L = (await import("leaflet")).default;
      const m = mapa.current;
      if (!m || !sloj.current) return;
      sloj.current.clearLayers();
      const zum = m.getZoom();
      const projektovane = tacke.map((t) => {
        const p = m.project([t.lat, t.lng], zum);
        return { x: p.x, y: p.y, t };
      });
      for (const grupa of grupisi(projektovane)) {
        if (grupa.length > 1) {
          const granice = L.latLngBounds(grupa.map((g) => [g.t.lat, g.t.lng] as [number, number]));
          const ikona = L.divIcon({
            className: "",
            html: `<div style="width:36px;height:36px;border-radius:9999px;background:#1f4f2a;color:#fff;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.3)">${grupa.length}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });
          L.marker(granice.getCenter(), { icon: ikona, title: tekstovi.grupa(grupa.length), keyboard: true })
            .on("click", () => {
              const isto = granice.getNorthEast().equals(granice.getSouthWest());
              if (isto) m.setView(granice.getCenter(), Math.min(zum + 3, 18));
              else m.fitBounds(granice, { padding: [40, 40], maxZoom: 18 });
            })
            .addTo(sloj.current);
          continue;
        }
        const t = grupa[0].t;
        const gazd = t.vrsta === "GAZDINSTVO";
        const ikona = L.divIcon({
          className: "",
          html: `<div style="width:30px;height:30px;border-radius:9999px;background:${gazd ? "#2f6b3a" : "#b8862b"};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,.3)">${gazd ? "🌾" : "🏪"}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -14],
        });
        const marker = L.marker([t.lat, t.lng], { icon: ikona, keyboard: true }).bindPopup(kartica(t));
        if (prikaziLabelu(zum)) {
          const labela = document.createElement("span");
          labela.textContent = t.naziv;
          marker.bindTooltip(labela, { permanent: true, direction: "top", offset: [0, -14], opacity: 0.9 });
        }
        // Prelaz mišem otvara karticu na računaru; na dodir radi klik.
        marker.on("mouseover", () => marker.openPopup());
        marker.addTo(sloj.current);
      }
      if (prvoUklapanje && tacke.length > 0) {
        prvoUklapanje = false;
        const granice = L.latLngBounds(tacke.map((t) => [t.lat, t.lng] as [number, number]));
        m.fitBounds(granice, { padding: [30, 30], maxZoom: 13 });
      }
    };
    crtajRef.current = () => void crtaj();
    void crtaj();
    const el = kontejner.current;
    const naSpremno = () => void crtaj();
    el?.addEventListener("mapa-spremna", naSpremno);
    return () => el?.removeEventListener("mapa-spremna", naSpremno);
  }, [tacke, prijavljen, tekstovi]);

  return (
    <div className="relative">
      <div ref={kontejner} className="w-full rounded-kartica border border-kolo-border overflow-hidden z-0" style={{ height: `min(${visina}px, 55vh)` }} />
      {zakljucana && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 z-[500] mx-auto w-max max-w-[90%] rounded-full bg-kolo-text/80 px-3 py-1.5 text-center text-xs font-medium text-white">
          {tMapa("mapa_dodirni")}
        </p>
      )}
    </div>
  );
}
