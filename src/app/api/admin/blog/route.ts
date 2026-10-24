import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeAdmin } from "@/lib/dozvole";

// POST /api/admin/blog — kreira novu vest
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Pristup odbijen.", 403);
  }

  const body = await req.json();
  const title = (body.title ?? "").toString().trim();
  const content = (body.content ?? "").toString().trim();
  const publishedAtRaw = body.publishedAt;

  if (!title) {
    return await greska("Naslov je obavezan.", 400);
  }
  if (title.length > 200) {
    return await greska("Naslov najviše 200 znakova.", 400);
  }
  if (!content) {
    return await greska("Sadržaj je obavezan.", 400);
  }
  if (content.length > 20000) {
    return await greska("Sadržaj najviše 20.000 znakova.", 400);
  }

  let publishedAt: Date | undefined;
  if (publishedAtRaw) {
    const d = new Date(publishedAtRaw);
    if (isNaN(d.getTime())) {
      return await greska("Neispravan datum objave.", 400);
    }
    publishedAt = d;
  }

  const objava = await prisma.blogPost.create({
    data: {
      title,
      content,
      authorId: session.user.id,
      ...(publishedAt ? { publishedAt } : {}),
    },
  });

  await logAdminAkcija(session.user.id, "BLOG_OBJAVA_KREIRANA", objava.id, title);

  return NextResponse.json({ ok: true, id: objava.id });
}

// GET /api/admin/blog — admin lista (sve objave)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Pristup odbijen.", 403);
  }

  const objave = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { pseudonim: true } } },
  });

  return NextResponse.json(
    objave.map((o) => ({
      id: o.id,
      title: o.title,
      content: o.content,
      authorPseudonim: o.author.pseudonim,
      publishedAt: o.publishedAt.toISOString(),
      createdAt: o.createdAt.toISOString(),
    }))
  );
}
