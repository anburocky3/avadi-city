import { prisma } from "@/lib/prisma";
import { Volunteer } from "@/types/volunteer";
import { seedVolunteers } from "@/data/seed";

export function mapPrismaVolunteerToVolunteer(v: any): Volunteer {
  return {
    id: v.displayId || v.id,
    userId: v.userId || "",
    fullName: v.fullName,
    ward: v.ward,
    gender: v.gender,
    age: v.age,
    dob: v.dob || undefined,
    contact: {
      mobile: v.mobile,
      whatsapp: v.whatsapp,
      area: v.area,
      showPhonePublic: Boolean(v.showPhonePublic),
    },
    emergencyContact: {
      name: v.emergencyName,
      phone: v.emergencyPhone,
      relationship: v.emergencyRelationship,
    },
    languages: Array.isArray(v.languages) ? v.languages : [],
    interests: Array.isArray(v.interests) ? v.interests : [],
    skills: Array.isArray(v.skills) ? v.skills : [],
    otherSkill: v.otherSkill || undefined,
    experience: v.experience,
    bio: v.bio || undefined,
    vehicle: v.vehicle,
    availability: v.availability || {
      days: [],
      slots: [],
      type: "Anytime",
      radius: "Anywhere in Avadi",
    },
    health: {
      bloodGroup: v.bloodGroup,
      willDonateBlood: Boolean(v.willDonateBlood),
      lastDonation: v.lastDonation || undefined,
      fitness: v.fitness || "Yes",
      conditions: v.conditions || undefined,
    },
    guardian: v.guardian || null,
    consents: {
      conduct: Boolean(v.conductConsent),
      directory: Boolean(v.directoryConsent),
      truthful: Boolean(v.truthfulConsent),
    },
    status: v.status || "active",
    createdAt:
      typeof v.createdAt === "string"
        ? v.createdAt
        : v.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt:
      typeof v.updatedAt === "string"
        ? v.updatedAt
        : v.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

export async function getDbVolunteers(): Promise<Volunteer[]> {
  try {
    const list = await prisma.volunteer.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (list.length > 0) {
      return list.map(mapPrismaVolunteerToVolunteer);
    }

    // Auto-seed initial volunteers into MySQL if table is currently empty
    for (const sv of seedVolunteers) {
      await prisma.volunteer.create({
        data: {
          displayId: sv.id,
          userId: null,
          fullName: sv.fullName,
          ward: sv.ward,
          gender: sv.gender,
          age: sv.age,
          dob: sv.dob || null,
          mobile: sv.contact.mobile,
          whatsapp: sv.contact.whatsapp,
          area: sv.contact.area,
          showPhonePublic: sv.contact.showPhonePublic,
          emergencyName: sv.emergencyContact.name,
          emergencyPhone: sv.emergencyContact.phone,
          emergencyRelationship: sv.emergencyContact.relationship,
          languages: sv.languages,
          interests: sv.interests,
          skills: sv.skills,
          otherSkill: sv.otherSkill || null,
          experience: sv.experience,
          bio: sv.bio || null,
          vehicle: sv.vehicle,
          availability: sv.availability as any,
          bloodGroup: sv.health.bloodGroup,
          willDonateBlood: sv.health.willDonateBlood,
          lastDonation: sv.health.lastDonation || null,
          fitness: sv.health.fitness,
          conditions: sv.health.conditions || null,
          guardian: (sv.guardian as any) || null,
          conductConsent: sv.consents.conduct,
          directoryConsent: sv.consents.directory,
          truthfulConsent: sv.consents.truthful,
          status: sv.status,
        },
      });
    }

    const seeded = await prisma.volunteer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return seeded.map(mapPrismaVolunteerToVolunteer);
  } catch (error) {
    console.error("Database query failed in getDbVolunteers:", error);
    return seedVolunteers;
  }
}
