"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";

/**
 * Slika oglasa sa rezervnim prikazom.
 *
 * Kad slika ne stigne (skladište ne odgovori, oglas obrisan, mreža), pretraživač
 * je crtao ikonicu polomljene slike i `alt` tekst preko praznog polja od 180 px.
 * Sada se umesto toga prikazuje isto što i oglas bez slike — `rezerva`
 * (ikonica kategorije). Važi za Pijacu, naslovnu i detalj oglasa.
 */
export default function SlikaOglasa({
  rezerva,
  ...props
}: ImageProps & { rezerva: ReactNode }) {
  const [pala, setPala] = useState(false);
  if (pala) return <>{rezerva}</>;
  return <Image {...props} onError={() => setPala(true)} />;
}
