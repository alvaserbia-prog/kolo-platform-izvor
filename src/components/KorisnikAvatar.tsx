import Link from "next/link";
import { profilHref } from "@/lib/profil-link";

// Mali okrugli avatar korisnika. Podržava R2/http URL i legacy base64 data URI;
// fallback = inicijal pseudonima na zelenoj pozadini. Ako je prosleđen `userId`,
// avatar je link ka javnom profilu (NE koristiti unutar <button> — daje ugnežden
// interaktivni element; tamo izostaviti `userId`).
export default function KorisnikAvatar({
  avatar,
  pseudonim,
  userId,
  size = 28,
  className = "",
}: {
  avatar: string | null;
  pseudonim: string;
  userId?: string;
  size?: number;
  className?: string;
}) {
  const inicijal = (pseudonim?.trim()?.[0] ?? "?").toUpperCase();
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  const base = `shrink-0 rounded-full overflow-hidden bg-kolo-green-700 flex items-center justify-center text-white font-bold ${className}`;

  const sadrzaj = avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar}
      alt={pseudonim}
      width={size}
      height={size}
      decoding="async"
      className="w-full h-full object-cover"
    />
  ) : (
    inicijal
  );

  if (userId) {
    return (
      <Link href={profilHref({ id: userId, pseudonim })} title={pseudonim} className={base} style={style}>
        {sadrzaj}
      </Link>
    );
  }
  return (
    <div title={pseudonim} className={base} style={style}>
      {sadrzaj}
    </div>
  );
}
