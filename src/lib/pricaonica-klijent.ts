/**
 * Izmena i brisanje sopstvene poruke u Pričaonici — zajedničko za sobu odraslih
 * i dečju sobu (obe idu kroz `/api/chat/[id]`). Vraća `null` kad je uspelo,
 * inače poruku o grešci sa servera (već prevedenu), odnosno `rezervna`.
 */
export async function izmeniPorukuPricaonice(
  id: string,
  content: string,
  rezervna: string,
): Promise<string | null> {
  return pozovi(`/api/chat/${id}`, "PATCH", rezervna, { content });
}

export async function obrisiPorukuPricaonice(id: string, rezervna: string): Promise<string | null> {
  return pozovi(`/api/chat/${id}`, "DELETE", rezervna);
}

async function pozovi(
  url: string,
  method: "PATCH" | "DELETE",
  rezervna: string,
  telo?: unknown,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: telo ? { "Content-Type": "application/json" } : undefined,
      body: telo ? JSON.stringify(telo) : undefined,
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data?.error ?? rezervna;
  } catch {
    return rezervna;
  }
}
