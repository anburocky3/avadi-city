import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken, signAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { BloodGroup, Gender } from "@/prisma/generated/prisma/enums";

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const name = formData.get("name")?.toString();
    const phone = formData.get("phone")?.toString();
    const gender = formData.get("gender")?.toString();
    const bloodGroup = formData.get("bloodGroup")?.toString();
    const file = formData.get("avatar") as File | null;

    const wardNumberRaw = formData.get("wardNumber");
    const wardNumber = wardNumberRaw ? Number(wardNumberRaw) : undefined;
    const streetName = formData.get("streetName")?.toString();

    // Fetch ONLY the avatar field to check for cleanup (prevents over-fetching)
    const existingUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { avatar: true },
    });

    let newAvatarUrl = existingUser?.avatar;

    if (file && file.size > 0) {
      // 1. Delete old avatar from R2 if it exists
      if (
        existingUser?.avatar &&
        existingUser.avatar.startsWith(PUBLIC_R2_DOMAIN)
      ) {
        try {
          const oldKey = existingUser.avatar.replace(
            `${PUBLIC_R2_DOMAIN}/`,
            "",
          );
          await r2Client.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: oldKey,
            }),
          );
        } catch (delError) {
          console.error("Failed to delete old avatar from R2:", delError);
        }
      }

      // 2. Upload new compressed WebP image to R2
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileKey = `profiles/${payload.userId}-${Date.now()}.webp`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: "image/webp",
        }),
      );

      newAvatarUrl = `${PUBLIC_R2_DOMAIN}/${fileKey}`;
    }

    // 3. Update user record in Prisma database
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: name !== undefined ? name?.trim() : undefined,
        phone: phone !== undefined ? phone?.trim() : undefined,
        gender:
          gender !== undefined &&
          Object.values(Gender).includes(gender as Gender)
            ? (gender as Gender)
            : undefined,
        bloodGroup:
          bloodGroup !== undefined &&
          Object.values(BloodGroup).includes(bloodGroup as BloodGroup)
            ? (bloodGroup as BloodGroup)
            : undefined,
        avatar: newAvatarUrl,
        wardNumber:
          wardNumber !== undefined && !isNaN(wardNumber)
            ? wardNumber
            : undefined,
        streetName: streetName !== undefined ? streetName?.trim() : undefined,
      },
    });

    // Generate fresh auth token using the newly updated database values
    const newToken = await signAuthToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      wardNumber: updatedUser.wardNumber,
    });

    cookieStore.set("avadi_session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json(
      { success: true, user: updatedUser },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to update profile." },
      { status: 500 },
    );
  }
}
