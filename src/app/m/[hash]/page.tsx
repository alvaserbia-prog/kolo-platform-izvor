"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function MemberLinkPage() {
  const { hash } = useParams<{ hash: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("common");

  useEffect(() => {
    async function resolve() {
      // Proveri da li je hash validan
      const res = await fetch(`/api/m/${hash}/pseudonim`);
      if (!res.ok) {
        router.replace("/");
        return;
      }
      const data = await res.json();

      // Proveri da li je korisnik prijavljen
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user) {
        // Ulogovan → preusmeri na novčanik
        const params = new URLSearchParams({ primalac: data.pseudonim });
        const amount = searchParams.get("amount");
        if (amount) params.set("iznos", amount);
        const opis = searchParams.get("opis");
        if (opis) params.set("description", opis);
        router.replace(`/novcanik?${params.toString()}`);
      } else {
        // Nije ulogovan → preusmeri na login, pa nazad na ovaj link (POEN transfer)
        const qs = searchParams.toString();
        const callbackUrl = encodeURIComponent(`/m/${hash}${qs ? `?${qs}` : ""}`);
        router.replace(`/login?callbackUrl=${callbackUrl}`);
      }
    }
    resolve();
  }, [hash, router, searchParams]);

  return (
    <div className="min-h-screen bg-kolo-bg flex items-center justify-center">
      <p className="text-kolo-muted text-sm">{t("ucitavanje")}</p>
    </div>
  );
}
