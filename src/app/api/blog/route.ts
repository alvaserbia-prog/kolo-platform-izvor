import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blog — javna lista vesti Fondacije
export async function GET() {
  const objave = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: { author: { select: { pseudonim: true } } },
  });

  return NextResponse.json(
    objave.map((o) => ({
      id: o.id,
      title: o.title,
      content: o.content,
      authorPseudonim: o.author.pseudonim,
      publishedAt: o.publishedAt.toISOString(),
    }))
  );
}
