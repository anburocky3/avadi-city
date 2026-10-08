import { NextResponse } from "next/server";
import * as zod from "zod";
import { prisma } from "@/lib/prisma";

// Server-side Zod Schema
const contactSchema = zod.object({
  fullName: zod.string().min(2, "Full name is required"),
  email: zod.string().email("Enter a valid email address"),
  phone: zod
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(zod.literal("")),
  category: zod.enum(
    ["technical", "collaboration", "feedback", "civic_issue"],
    {
      error: "Please select an inquiry category",
    },
  ),
  wardNumber: zod.number().optional(),
  message: zod.string().min(10, "Message must be at least 10 characters long"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request payload
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { fullName, email, phone, category, wardNumber, message } =
      validation.data;

    console.log("Available Prisma Models:", Object.keys(prisma));

    // Save to MySQL Database using Prisma
    const submission = await prisma.contactSubmission.create({
      data: {
        fullName,
        email,
        phone: phone && phone.trim() !== "" ? phone : null,
        category,
        wardNumber: wardNumber && !isNaN(wardNumber) ? wardNumber : null,
        message,
        status: "pending", // Sets default status for your admin dashboard
      },
    });

    console.log(
      `✅ [MySQL] New Contact Submission Saved ID: #${submission.id}`,
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Your message has been sent successfully. We will get back to you shortly!",
        submissionId: submission.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Database Error in /api/contact:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "An error occurred while saving your request. Please try again later.",
      },
      { status: 500 },
    );
  }
}
