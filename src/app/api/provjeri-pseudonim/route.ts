import { NextRequest, NextResponse } from "next/server";
import { validanPseudonim, PSEUDONIM_PRAVILO } from "@/lib/validacija";
import { porukaZauzeca, proveriZauzece } from "@/lib/pseudonim";

export async function GET(req: NextRequest) {
  const pseudonim = req.nextUrl.searchParams.get("p")?.trim();
  if (!validanPseudonim(pseudonim)) {
    return NextResponse.json({ slobodan: false, greska: PSEUDONIM_PRAVILO });
  }
  // Zauzeto je i ime koje je neko ranije napustio — stari linkovi vode na njega.
  const zauzece = await proveriZauzece(pseudonim);
  return NextResponse.json({
    slobodan: !zauzece,
    ...(zauzece ? { greska: porukaZauzeca(zauzece) } : {}),
  });
}
