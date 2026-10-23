import { VolunteerFormData } from "@/types/volunteer";
import { DonationFormData } from "@/types/donation";

/**
 * Validates 10-digit Indian mobile number:
 * Starts with 6, 7, 8, or 9 and has exactly 10 digits.
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

export function isValidIndianPhone(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function isValidDateNotInPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target >= today;
}

export function isValidDateNotInFuture(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return target <= today;
}

// ==========================================
// VOLUNTEER STEP VALIDATORS
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateVolunteerStep1(
  data: Partial<VolunteerFormData>,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.contact?.mobile || !isValidIndianPhone(data.contact.mobile)) {
    errors.mobile = "Please enter a valid 10-digit Indian mobile number (starts with 6-9).";
  }

  if (!data.contact?.whatsapp || !isValidIndianPhone(data.contact.whatsapp)) {
    errors.whatsapp = "Please enter a valid 10-digit WhatsApp number.";
  }

  if (!data.contact?.area || data.contact.area.trim().length < 3) {
    errors.area = "Area / street / landmark is required (at least 3 characters).";
  }

  if (!data.languages || data.languages.length === 0) {
    errors.languages = "Please select at least one preferred language.";
  }

  if (!data.emergencyContact?.name || data.emergencyContact.name.trim().length < 2) {
    errors.emergencyName = "Emergency contact name is required.";
  }

  if (
    !data.emergencyContact?.phone ||
    !isValidIndianPhone(data.emergencyContact.phone)
  ) {
    errors.emergencyPhone = "Valid 10-digit emergency contact phone is required.";
  }

  if (
    !data.emergencyContact?.relationship ||
    data.emergencyContact.relationship.trim().length === 0
  ) {
    errors.emergencyRelationship = "Relationship is required (e.g. Parent, Spouse, Friend).";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateVolunteerStep2(
  data: Partial<VolunteerFormData>,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.interests || data.interests.length === 0) {
    errors.interests = "Please select at least one volunteering interest.";
  }

  if ((!data.skills || data.skills.length === 0) && !data.otherSkill?.trim()) {
    errors.skills = "Please select at least one skill or specify under Other.";
  }

  if (!data.experience) {
    errors.experience = "Please choose your experience level.";
  }

  if (data.bio && data.bio.length > 200) {
    errors.bio = "Short bio cannot exceed 200 characters.";
  }

  if (!data.vehicle) {
    errors.vehicle = "Please select vehicle availability.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateVolunteerStep3(
  data: Partial<VolunteerFormData>,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.availability?.days || data.availability.days.length === 0) {
    errors.days = "Please select at least one available day.";
  }

  if (!data.availability?.slots || data.availability.slots.length === 0) {
    errors.slots = "Please select at least one available time slot.";
  }

  if (!data.availability?.type) {
    errors.availabilityType = "Please select an availability type.";
  }

  if (!data.availability?.radius) {
    errors.radius = "Please select your preferred travel radius.";
  }

  if (!data.health?.bloodGroup) {
    errors.bloodGroup = "Blood group is required.";
  }

  if (!data.health?.fitness) {
    errors.fitness = "Please indicate your field work physical fitness.";
  }

  if (data.health?.willDonateBlood && data.health.lastDonation) {
    if (!isValidDateNotInFuture(data.health.lastDonation)) {
      errors.lastDonation = "Last blood donation date cannot be in the future.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateVolunteerStep4(
  data: Partial<VolunteerFormData>,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.consents?.conduct) {
    errors.conduct = "You must agree to the Volunteer Code of Conduct.";
  }

  if (!data.consents?.directory) {
    errors.directory = "Consent to share your profile in the directory is required.";
  }

  if (!data.consents?.truthful) {
    errors.truthful = "You must confirm that the provided information is accurate.";
  }

  const age = data.age || 0;
  if (age > 0 && age < 18) {
    if (!data.guardian?.name || data.guardian.name.trim().length < 2) {
      errors.guardianName = "Guardian name is required for volunteers under 18.";
    }
    if (!data.guardian?.consent) {
      errors.guardianConsent = "Guardian consent checkbox is required for minors.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ==========================================
// DONATION STEP VALIDATORS
// ==========================================

export function validateDonationStep1(
  data: Partial<DonationFormData>,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.type) {
    errors.type = "Please select a request type.";
  }

  if (!data.urgency) {
    errors.urgency = "Please specify the urgency level.";
  }

  const titleLength = data.title?.trim().length || 0;
  if (titleLength < 3 || titleLength > 80) {
    errors.title = "Title must be between 3 and 80 characters.";
  }

  // Description is OPTIONAL
  if (data.description && data.description.trim().length > 500) {
    errors.description = "Description cannot exceed 500 characters.";
  }

  if (!data.ward || data.ward < 1 || data.ward > 48) {
    errors.ward = "Please select a valid Avadi ward (1-48).";
  }

  if (!data.address || data.address.trim().length < 2) {
    errors.address = "Please provide an address or notable landmark.";
  }

  if (!data.beneficiary) {
    errors.beneficiary = "Please select beneficiary type.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateDonationStep2(
  data: Partial<DonationFormData>,
): ValidationResult {
  const errors: Record<string, string> = {};

  // Needed items are OPTIONAL!
  // If user entered items, validate that rows with names have quantities.
  if (data.items && data.items.length > 0) {
    const invalidItems = data.items.some(
      (item) => item.name?.trim() && (!item.qty || String(item.qty).trim() === "" || Number(item.qty) <= 0),
    );
    if (invalidItems) {
      errors.items = "Please enter a valid quantity for items with a name.";
    }
  }

  if (data.requiredBy && !isValidDateNotInPast(data.requiredBy)) {
    errors.requiredBy = "Required-by date must be today or in the future.";
  }

  if (!data.contact?.name || data.contact.name.trim().length < 2) {
    errors.contactName = "Contact person name is required.";
  }

  if (!data.contact?.phone || !isValidIndianPhone(data.contact.phone)) {
    errors.contactPhone = "Please enter a valid 10-digit contact phone.";
  }

  if (!data.contact?.whatsapp || !isValidIndianPhone(data.contact.whatsapp)) {
    errors.contactWhatsapp = "Please enter a valid 10-digit WhatsApp number.";
  }

  if (data.target?.upi && data.target.upi.trim().length > 0) {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(data.target.upi.trim())) {
      errors.targetUpi = "Please enter a valid UPI ID (e.g. name@okhdfcbank).";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateDonationStep3(
  data: Partial<DonationFormData>,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.confirmedGenuine) {
    errors.confirmedGenuine = "You must confirm that this request is genuine.";
  }

  if (!data.agreedGuidelines) {
    errors.agreedGuidelines = "You must agree to the Community Guidelines.";
  }

  if (
    data.beneficiary === "Community or Institution" &&
    data.organisation?.name &&
    data.organisation.name.trim().length < 3
  ) {
    errors.orgName = "Organisation name must be at least 3 characters.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
