import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import LoginForm from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return pageMetadata({
    title: `${t("naslov")} — KOLO`,
    description: t("podnaslov"),
    path: "/login",
  });
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
