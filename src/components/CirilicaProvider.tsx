"use client";

import { useLayoutEffect, useEffect } from "react";
import { useLocale } from "next-intl";
import { lat2cyr } from "@/lib/lat2cyr";

// Globalna transliteracija prikazanog teksta u ćirilicu kada je aktivan
// locale "sr-Cyrl". Pokriva SVE: i18n poruke, Markdown pravne strane, tekst
// zakucan direktno u JSX-u i korisnički sadržaj. Menjamo isključivo PRIKAZANI
// tekst (text node-ovi + nekoliko vidljivih atributa) — nikad `value` polja,
// `href`, ni druge atribute, pa funkcionalnost (linkovi, forme, login) ostaje
// netaknuta. lat2cyr je idempotentan, pa ponovni prolazi ne kvare tekst.

// Elementi čiji se sadržaj NIKAD ne transliteriše.
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA", "NOSCRIPT", "KBD", "SAMP",
]);

// Vidljivi atributi koje takođe konvertujemo (tooltipovi, placeholderi…).
const ATRIBUTI = ["placeholder", "title", "aria-label", "alt"];

function unutarSkip(node: Node | null): boolean {
  let el: HTMLElement | null =
    node && node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node?.parentElement ?? null;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute("data-no-cyr")) return true;
    if (el.isContentEditable) return true;
    el = el.parentElement;
  }
  return false;
}

function konvertujTextNode(node: Node) {
  const v = node.nodeValue;
  if (!v || !v.trim()) return;
  const c = lat2cyr(v);
  if (c !== v) node.nodeValue = c;
}

function konvertujAtribute(el: HTMLElement) {
  for (const attr of ATRIBUTI) {
    const v = el.getAttribute(attr);
    if (!v || !v.trim()) continue;
    const c = lat2cyr(v);
    if (c !== v) el.setAttribute(attr, c);
  }
}

function obidjiStablo(root: Node) {
  // Atributi na samom korenu i potomcima.
  if (root.nodeType === Node.ELEMENT_NODE) {
    const el = root as HTMLElement;
    if (!unutarSkip(el)) {
      konvertujAtribute(el);
      el.querySelectorAll<HTMLElement>(ATRIBUTI.map((a) => `[${a}]`).join(",")).forEach(
        (e) => {
          if (!unutarSkip(e)) konvertujAtribute(e);
        },
      );
    }
  }

  // Tekstualni čvorovi.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (unutarSkip(n)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Node[] = [];
  let n = walker.nextNode();
  while (n) {
    nodes.push(n);
    n = walker.nextNode();
  }
  nodes.forEach(konvertujTextNode);
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function CirilicaProvider() {
  const locale = useLocale();

  useIsoLayoutEffect(() => {
    if (locale !== "sr-Cyrl") return;
    if (typeof document === "undefined") return;

    // <title> je u <head> (van body walkera) — konvertuj ga zasebno i prati izmene
    // (Next ga menja pri navigaciji).
    const konvertujNaslov = () => {
      const t = document.title;
      if (t) {
        const c = lat2cyr(t);
        if (c !== t) document.title = c;
      }
    };

    // Prvi prolaz pre prvog iscrtavanja (useLayoutEffect) — bez vidljivog bljeska.
    obidjiStablo(document.body);
    konvertujNaslov();

    const titleEl = document.querySelector("title");
    const titleObs = titleEl
      ? new (window.MutationObserver)(konvertujNaslov)
      : null;
    if (titleEl && titleObs) {
      titleObs.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    // Prati naknadne promene (klijentski render, navigacija, dinamički tekst).
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "characterData") {
          if (!unutarSkip(m.target)) konvertujTextNode(m.target);
        } else if (m.type === "attributes") {
          const el = m.target as HTMLElement;
          if (!unutarSkip(el)) konvertujAtribute(el);
        } else {
          m.addedNodes.forEach((an) => {
            if (an.nodeType === Node.TEXT_NODE) {
              if (!unutarSkip(an)) konvertujTextNode(an);
            } else if (an.nodeType === Node.ELEMENT_NODE) {
              obidjiStablo(an);
            }
          });
        }
      }
    });
    obs.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATRIBUTI,
    });

    return () => {
      obs.disconnect();
      titleObs?.disconnect();
    };
  }, [locale]);

  return null;
}
