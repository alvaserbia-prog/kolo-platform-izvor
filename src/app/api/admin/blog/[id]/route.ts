import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeAdmin } from "@/lib/dozvole";

// PATCH /api/admin/blog/[id] — izmena
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Pristup odbijen.", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const title = body.title !== undefined ? body.title.toString().trim() : undefined;
  const content = body.content !== undefined ? body.content.toString().trim() : undefined;

  if (title !== undefined) {
    if (!title) return await greska("Naslov je obavezan.", 400);
    if (title.length > 200)
      return await greska("Naslov najviše 200 znakova.", 400);
  }
  if (content !== undefined) {
    if (!content) return await greska("Sadržaj je obavezan.", 400);
    if (content.length > 20000)
      return await greska("Sadržaj najviše 20.000 znakova.", 400);
  }

  let publishedAt: Date | undefined;
  if (body.publishedAt) {
    const d = new Date(body.publishedAt);
    if (isNaN(d.getTime())) {
      return await greska("Neispravan datum objave.", 400);
    }
    publishedAt = d;
  }

  const exists = await prisma.blogPost.findUnique({ where: { id } });
  if (!exists) return await greska("Objava nije pronađena.", 404);

  await prisma.blogPost.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(publishedAt ? { publishedAt } : {}),
    },
  });

  await logAdminAkcija(session.user.id, "BLOG_OBJAVA_IZMENJENA", id, title ?? exists.title);

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/blog/[id] — brisanje
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Pristup odbijen.", 403);
  }

  const { id } = await params;
  const exists = await prisma.blogPost.findUnique({ where: { id } });
  if (!exists) return await greska("Objava nije pronađena.", 404);

  await prisma.blogPost.delete({ where: { id } });
  await logAdminAkcija(session.user.id, "BLOG_OBJAVA_OBRISANA", id, exists.title);

  return NextResponse.json({ ok: true });
}
