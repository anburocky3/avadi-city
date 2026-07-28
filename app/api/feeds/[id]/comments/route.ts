import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.text?.trim()) {
      return NextResponse.json(
        { message: "Comment cannot be empty." },
        { status: 400 },
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        feedId: id, // Maps to feedId in our updated Prisma schema
        author: body.author || "Avadi Resident",
        authorId: body.authorId || null,
        text: body.text.trim(),
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error("Comment DB error:", error?.message || error);
    return NextResponse.json(
      { message: "Failed to save comment." },
      { status: 500 },
    );
  }
}
