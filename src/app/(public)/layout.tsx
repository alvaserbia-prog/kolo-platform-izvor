import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kolo-bg flex flex-col">
      <PublicHeader />
      <main className="max-w-[932px] mx-auto px-6 py-6 w-full flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
