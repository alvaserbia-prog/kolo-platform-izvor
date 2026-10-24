import Image from "next/image";
import logoImg from "@/assets/kolo-icon.png";
import plocicaImg from "@/assets/kolo-icon-plocica.png";

/**
 * Logotip KOLO: znak + naziv. Jedan crtež svuda (bile su četiri varijante sa
 * različitim razmakom slova i pločicom samo ponegde).
 *  - `tema="tamna"`  — na tamnozelenoj podlozi (zaglavlje aplikacije, meni): znak na
 *    svojoj pločici (zeleni znak se na tamnozelenoj podlozi gubi) i beli naziv;
 *  - `tema="svetla"` — na beloj podlozi (javno zaglavlje, podnožje): tamnozeleni naziv.
 */
export default function Logo({
  tema = "svetla",
  velicina = "md",
  prioritet = false,
}: {
  tema?: "svetla" | "tamna";
  velicina?: "xs" | "sm" | "md";
  prioritet?: boolean;
}) {
  // 🔴 Jedan odnos svuda: slova KOLO su 0,6 visine znaka, razmak 0,25 visine.
  // `md` (sva zaglavlja i meniji): 34 px na telefonu, 40 px od `md` širine —
  // isto na javnim stranicama i u aplikaciji, u zaglavlju i u otvorenom meniju.
  // `sm` (podnožje): 30 px. `xs` (zaglavlje aplikacije na telefonu, uz dugme
  // „Meni"): 28 px — naziv tada nije krupniji od reči „Meni". Slika je obrezana do znaka, pa je visina ujedno i
  // vidljiva veličina. Klase su ispisane cele da ih Tailwind nađe.
  const klase =
    velicina === "xs"
      ? { razmak: "gap-[7px]", znak: "h-[28px]", naziv: "text-[17px]" }
      : velicina === "sm"
      ? { razmak: "gap-2", znak: "h-[30px]", naziv: "text-[18px]" }
      : { razmak: "gap-2 md:gap-2.5", znak: "h-[34px] md:h-10", naziv: "text-[20px] md:text-[24px]" };
  return (
    <span className={`inline-flex items-center ${klase.razmak}`}>
      <Image src={tema === "tamna" ? plocicaImg : logoImg} alt="" width={40} height={40} priority={prioritet} className={`shrink-0 object-contain w-auto ${klase.znak}`} />
      <span className={`font-bold leading-none tracking-[0.12em] ${klase.naziv} ${tema === "tamna" ? "text-white" : "text-kolo-green-900"}`}>
        KOLO
      </span>
    </span>
  );
}
