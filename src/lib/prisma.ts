import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // Neon DATABASE_URL sadrži `?sslmode=require`. pg-connection-string ga parsira i na
  // SVAKU novu konekciju ispiše „SECURITY WARNING: ... sslmode ... verify-full". U
  // serverless-u (cold start po pozivu — npr. polling /api/notifikacije na 15s) to se
  // gomila u logovima. Skidamo sslmode iz URL-a i prosleđujemo eksplicitan `ssl` objekat
  // koji zadržava isto ponašanje (verify-full = provera CA), pa upozorenje nestaje.
  const raw = process.env.DATABASE_URL!;
  let connectionString = raw;
  let ssl: { rejectUnauthorized: boolean } | undefined;
  try {
    const url = new URL(raw);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode) {
      url.searchParams.delete("sslmode");
      connectionString = url.toString();
      // require/verify-ca/verify-full → zadrži proveru CA; samo disable/no-verify je isključuje
      ssl = { rejectUnauthorized: sslmode !== "disable" && sslmode !== "no-verify" };
    }
  } catch {
    // neparsabilan URL — ostavi original, neka adapter sam odluči
  }

  const adapter = new PrismaPg({ connectionString, ...(ssl ? { ssl } : {}) });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
