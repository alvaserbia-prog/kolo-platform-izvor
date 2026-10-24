/**
 * Priprema slika PRE slanja na rutu (Pijaca — nov oglas i izmena oglasa).
 *
 * Dva kvara koja ovo rešava, oba viđena na pravom nalogu:
 *
 * 🔴 **Fotografija sa iPhone-a (HEIC/HEIF).** Polje za izbor stoji na
 * `accept="image/*"`, pa telefon ponudi i HEIC. Ranija kompresija je radila
 * isključivo preko `createImageBitmap`, koji HEIC ne dekodira nigde osim na
 * Apple uređajima — a na neuspeh je vraćala ORIGINAL. Takav fajl ruta odbija
 * („Dozvoljeni formati: JPG, PNG, WebP"), pa je čovek dobijao poruku o formatu
 * za sliku koju mu je sam telefon ponudio. Sada se dekodiranje pokušava i preko
 * `<img>` (Safari tim putem ume HEIC), a kad nijedan put ne uspe — slika se
 * ODBIJA uz objašnjenje, umesto da se pošalje u prazno.
 *
 * 🔴 **Ukupna veličina zahteva.** Serverless platforma prima telo do ~4,5MB i
 * odbija veće PRE nego što ruta uopšte krene — odgovor tada nije JSON, pa je
 * `res.json()` na ekranu pucao i čovek je dobijao samo „Greška pri slanju".
 * Provera po jednoj slici (5MB) tu ne pomaže: pet slika od po 3MB svaka prolazi
 * pojedinačnu proveru, a zajedno se ne mogu poslati. Zato se ovde meri UKUPNO.
 *
 * 🔴 **Memorija na iPhone-u.** Fotografija sa telefona je po pravilu 12 MP
 * (4032×3024); dekodirana zauzima ≈48MB. Ranije su se SVE izabrane slike
 * dekodirale ODJEDNOM (`Promise.all`), pa je pet fotografija tražilo ~240MB u
 * jednom trenutku. iOS Safari na to odbacuje stranicu i učitava je iznova — sa
 * strane korisnika to izgleda kao „štikliram slike i izbaci me, ikonice se ne
 * pojave". Zato `pripremiSlike` ide JEDNU PO JEDNU, oslobađa svaku pre nego što
 * uzme sledeću i prepušta nit između njih.
 *
 * Fajl je bez ijednog uvoza i koriste ga i ekran i (za konstante) rute.
 */

/** Najviše slika po oglasu. */
export const MAX_SLIKA = 5;

/** Formati koje ruta prima. Sve ostalo se u pretraživaču prekodira u JPEG. */
export const DOZVOLJENI_TIPOVI: readonly string[] = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/** Gornja granica po jednoj slici — ista u ruti. */
export const MAX_PO_SLICI = 5 * 1024 * 1024;

/**
 * Gornja granica UKUPNOG tela zahteva.
 *
 * 🔴 Broj nije proizvoljan: serverless funkcija prima ~4,5MB, a u telo pored
 * slika ulaze i polja obrasca i granice multipart-a. 4MB ostavlja rezervu i
 * brani se PRE slanja, gde poruka može da bude razumljiva.
 */
export const MAX_UKUPNO = 4 * 1024 * 1024;

/** Najveća strana pripremljene slike. */
const MAX_DIM = 1600;

/**
 * Iznad ove veličine datoteke slika se smanjuje već pri dekodiranju.
 * Ispod nje se ne dira — mala slika bi se `resizeWidth`-om uvećavala.
 */
const PRAG_SMANJENJA_PRI_DEKODIRANJU = 1024 * 1024;

/** Ciljna veličina jedne pripremljene slike — pet takvih staje u `MAX_UKUPNO`. */
const CILJ_PO_SLICI = 700 * 1024;

/** Lestvica [najveća dimenzija, kvalitet] — ide se redom dok slika ne stane u cilj. */
const LESTVICA: ReadonlyArray<readonly [number, number]> = [
  [MAX_DIM, 0.82],
  [MAX_DIM, 0.7],
  [1280, 0.68],
  [1024, 0.62],
];

type Izvor = {
  slika: CanvasImageSource;
  sirina: number;
  visina: number;
  oslobodi: () => void;
};

/**
 * Dekodiraj sliku u nešto što `drawImage` prima.
 *
 * Tri pokušaja, namerno tim redom: `createImageBitmap` sa EXIF orijentacijom
 * (inače fotografija sa telefona ume da legne postrance), isti bez opcija (stariji
 * pretraživači ne poznaju drugi argument), pa `<img>` — koji dekodira sve što
 * pretraživač ume da PRIKAŽE, uključujući HEIC na Apple uređajima.
 */
async function dekodiraj(file: File): Promise<Izvor | null> {
  if (typeof createImageBitmap === "function") {
    // 🔴 Smanjenje PRI dekodiranju, pre svega ostalog. Bez njega se fotografija
    // od 12 MP raspakuje u punoj rezoluciji (4032×3024×4B ≈ 48MB) pa tek onda
    // smanjuje na platnu — a taj vrh je dovoljan da stariji iPhone odbaci
    // karticu i kod JEDNE slike. Sa `resizeWidth` dekoder odmah daje umanjenu
    // sliku i vrh pada na ~1MB.
    //
    // Prag po veličini datoteke: fotografija preko 1MB je u praksi uvek šira od
    // `MAX_DIM`, pa nema uvećavanja male slike. Pretraživač koji ove opcije ne
    // poznaje ih ignoriše — tada se ponaša kao i pre, bez greške.
    if (file.size > PRAG_SMANJENJA_PRI_DEKODIRANJU) {
      try {
        const bmp = await createImageBitmap(file, {
          imageOrientation: "from-image",
          resizeWidth: MAX_DIM,
          resizeQuality: "high",
        });
        return { slika: bmp, sirina: bmp.width, visina: bmp.height, oslobodi: () => bmp.close?.() };
      } catch {
        /* opcije nisu podržane — ide se punim putem ispod */
      }
    }
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { slika: bmp, sirina: bmp.width, visina: bmp.height, oslobodi: () => bmp.close?.() };
    } catch {
      /* sledeći pokušaj */
    }
    try {
      const bmp = await createImageBitmap(file);
      return { slika: bmp, sirina: bmp.width, visina: bmp.height, oslobodi: () => bmp.close?.() };
    } catch {
      /* sledeći pokušaj */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("slika se ne dekodira"));
      el.src = url;
    });
    if (!img.naturalWidth || !img.naturalHeight) throw new Error("prazna slika");
    return {
      slika: img,
      sirina: img.naturalWidth,
      visina: img.naturalHeight,
      oslobodi: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

/** Nacrtaj izvor na platno smanjeno na `maxDim` i vrati JPEG. */
async function uJpeg(izvor: Izvor, maxDim: number, kvalitet: number): Promise<Blob | null> {
  let { sirina, visina } = izvor;
  if (sirina > maxDim || visina > maxDim) {
    const skala = Math.min(maxDim / sirina, maxDim / visina);
    sirina = Math.max(1, Math.round(sirina * skala));
    visina = Math.max(1, Math.round(visina * skala));
  }
  const canvas = document.createElement("canvas");
  canvas.width = sirina;
  canvas.height = visina;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // Bela podloga: JPEG nema providnost, pa bi providan PNG inače pocrneo.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sirina, visina);
  ctx.drawImage(izvor.slika, 0, 0, sirina, visina);
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", kvalitet)
  );
}

function kaoFajl(blob: Blob, izvorniNaziv: string): File {
  const naziv = izvorniNaziv.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], naziv || "slika.jpg", { type: "image/jpeg" });
}

export type Pripremljena =
  | { ok: true; file: File }
  /** `format` — pretraživač sliku ne ume da dekodira; `velicina` — ni najniži kvalitet ne staje. */
  | { ok: false; razlog: "format" | "velicina" };

/**
 * Smanji i prekodiraj sliku za slanje.
 *
 * Vraća JPEG koji staje u `CILJ_PO_SLICI` kad god je to moguće. Original se
 * zadržava samo ako je već u dozvoljenom formatu i manji od rezultata
 * prekodiranja (sitna slika bi prekodiranjem samo porasla).
 */
export async function pripremiSliku(file: File): Promise<Pripremljena> {
  const dozvoljen = DOZVOLJENI_TIPOVI.includes(file.type);

  const izvor = await dekodiraj(file);
  if (!izvor) {
    // Pretraživač je ne ume dekodirati (po pravilu HEIC/HEIF van Apple uređaja).
    // Ako je format ipak takav da ga ruta prima i slika staje — propuštamo je;
    // inače je odbijamo ODMAH, da čovek ne čeka slanje koje ne može da prođe.
    if (dozvoljen && file.size <= CILJ_PO_SLICI) return { ok: true, file };
    return { ok: false, razlog: dozvoljen ? "velicina" : "format" };
  }

  try {
    let poslednji: Blob | null = null;
    for (const [dim, kvalitet] of LESTVICA) {
      const blob = await uJpeg(izvor, dim, kvalitet);
      if (!blob) break;
      poslednji = blob;
      if (blob.size <= CILJ_PO_SLICI) break;
    }

    if (!poslednji) {
      // Platno nije dostupno (stari pretraživač, privatni režim) — original
      // prolazi samo ako ga ruta prima i ako staje.
      if (dozvoljen && file.size <= CILJ_PO_SLICI) return { ok: true, file };
      return { ok: false, razlog: dozvoljen ? "velicina" : "format" };
    }

    if (dozvoljen && file.size <= poslednji.size && file.size <= CILJ_PO_SLICI) {
      return { ok: true, file };
    }
    if (poslednji.size > MAX_PO_SLICI) return { ok: false, razlog: "velicina" };
    return { ok: true, file: kaoFajl(poslednji, file.name) };
  } finally {
    izvor.oslobodi();
  }
}

/**
 * Izabrana slika spremna za slanje, uz adresu za sličicu.
 *
 * 🔴 Adresa se pravi TAČNO JEDNOM po slici i mora se osloboditi
 * (`URL.revokeObjectURL`) kad slika ode sa ekrana. Ranije je stajala u samom
 * renderu (`src={URL.createObjectURL(f)}`), pa je pri svakom iscrtavanju
 * nastajala nova, nijedna se nije oslobađala i svaka je držala celu datoteku u
 * memoriji — na telefonu dovoljno da stranica bude odbačena.
 */
export type IzabranaSlika = { file: File; pregled: string };

export function zaPregled(file: File): IzabranaSlika {
  return { file, pregled: URL.createObjectURL(file) };
}

export function oslobodiPregled(slika: IzabranaSlika | undefined): void {
  if (slika) URL.revokeObjectURL(slika.pregled);
}

/**
 * Pripremi izabrane slike JEDNU PO JEDNU.
 *
 * `nasledna` se zove posle svake uspešne slike, pa sličica izlazi na ekran čim
 * je gotova — čovek vidi da se nešto dešava i, ako obrada stane, ostaje mu ono
 * što je do tada pripremljeno.
 *
 * Redosled je namerno sekvencijalan: paralelno dekodiranje je ono što obara
 * karticu na telefonu (vidi uvodni komentar).
 */
export async function pripremiSlike(
  datoteke: readonly File[],
  naSvaku: (slika: IzabranaSlika) => void,
): Promise<{ formatOdbijen: boolean; velicinaOdbijena: boolean }> {
  let formatOdbijen = false;
  let velicinaOdbijena = false;

  for (const datoteka of datoteke) {
    const ishod = await pripremiSliku(datoteka);
    if (ishod.ok) naSvaku(zaPregled(ishod.file));
    else if (ishod.razlog === "format") formatOdbijen = true;
    else velicinaOdbijena = true;

    // Predah pre sledeće slike: daje pretraživaču priliku da oslobodi memoriju
    // prethodne i da iscrta sličicu pre nego što se nit opet zauzme.
    await new Promise((nastavi) => setTimeout(nastavi, 0));
  }

  return { formatOdbijen, velicinaOdbijena };
}

/** Zbir veličina — meri se pre slanja, jer platforma odbija preveliko telo bez JSON odgovora. */
export function ukupnaVelicina(slike: readonly File[]): number {
  return slike.reduce((zbir, f) => zbir + f.size, 0);
}

/**
 * Poruka o grešci iz odgovora rute, ili `null` kad odgovor NIJE JSON.
 *
 * `null` je očekivan ishod: platforma na preveliko telo (413) i na prekoračeno
 * vreme vraća svoju stranicu, ne naš `{ error }`. Poruku tada bira ekran — on
 * zna svoje prevode.
 */
export async function porukaIzOdgovora(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    const poruka = (data as { error?: unknown })?.error;
    return typeof poruka === "string" && poruka.trim() ? poruka : null;
  } catch {
    return null;
  }
}
