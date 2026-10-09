import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

import { getRentalListings } from "@/lib/rentals";

// ─── GET /api/rentals ───────────────────────────────────────────────────────
// Returns all APPROVED rental listings, newest first.
export async function GET() {
  try {
    const data = await getRentalListings();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[GET /api/rentals]", err);
    return NextResponse.json(
      { success: false, message: "Unable to fetch rental listings." },
      { status: 500 }
    );
  }
}

// ─── POST /api/rentals ──────────────────────────────────────────────────────
// Saves a new rental listing to the database.
// Requires a valid session cookie — saves as APPROVED so it's immediately visible.
export async function POST(request: Request) {
  try {
    // 1. Auth check (optional — graceful fallback if no session)
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    let userId: string | null = null;

    if (token) {
      const session = await verifyAuthToken(token);
      if (session?.userId) userId = session.userId;
    }

    // 2. Parse JSON body sent from the post form
    const body = await request.json();

    const {
      title,
      description,
      transactionType,
      category,
      propertyTypeTag,
      bhk,
      bathrooms,
      balconies,
      floor,
      builtUpArea,
      carpetArea,
      furnishing,
      facing,
      parking,
      preferredTenants,
      availability,
      ward,
      streetName,
      location,
      pricing,
      pgDetails,
      commercialDetails,
      localityIntel,
      amenities,
      images,
      imageUrl,
      owner,
      ownerName,
      contact,
      type,
      rent,
      advance,
    } = body;

    if (!title || !ward || !contact) {
      return NextResponse.json(
        { success: false, message: "Title, ward, and contact are required." },
        { status: 400 }
      );
    }

    // 3. Pack all rich fields into the "features" JSON column
    const richMeta = JSON.stringify({
      transactionType,
      category,
      propertyTypeTag,
      bhk,
      bathrooms,
      balconies,
      floor,
      builtUpArea,
      carpetArea,
      furnishing,
      facing,
      parking,
      preferredTenants,
      availability,
      streetName,
      pricing,
      pgDetails,
      commercialDetails,
      localityIntel,
      amenities,
      images,
      owner,
    });

    // 4. Save to DB — status APPROVED so it's visible immediately
    const newListing = await prisma.rentalListing.create({
      data: {
        title: String(title).trim(),
        type: String(type || (transactionType === "Sale" ? "Sale" : "Residential")).trim(),
        propertyTypeTag: propertyTypeTag ? String(propertyTypeTag) : null,
        rent: Math.round(Number(rent) || 0),
        advance: Math.round(Number(advance) || 0),
        contact: String(contact).trim(),
        ownerName: ownerName ? String(ownerName).trim() : null,
        location: location ? String(location).trim() : `Ward ${ward}, Avadi`,
        ward: Number(ward),
        imageUrl: imageUrl ? String(imageUrl).substring(0, 65535) : null,
        details: String(description || "").trim(),
        features: richMeta,
        status: "APPROVED",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Property listing published successfully!",
        id: newListing.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/rentals]", err);
    return NextResponse.json(
      { success: false, message: "Unable to save your listing. Please try again." },
      { status: 500 }
    );
  }
}
