import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: "avadi_session",
    path: "/",
  });
  return NextResponse.json({ success: true }, { status: 200 });
}

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: "avadi_session",
    path: "/",
  });
  return NextResponse.json({ success: true }, { status: 200 });
}
