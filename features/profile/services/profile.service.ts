import imageCompression from "browser-image-compression";
import volunteerService from "@/services/volunteerService";
import type { Volunteer } from "@/types/volunteer";

export interface ProfileVolunteerIdentity {
  id: string;
  phone?: string;
  name?: string;
}

const getVolunteer = (
  identity: ProfileVolunteerIdentity,
): Volunteer | null =>
  volunteerService.getMyVolunteer(identity.id, identity.phone, identity.name);

export const profileService = {
  getVolunteer,

  async syncVolunteer(
    identity: ProfileVolunteerIdentity,
  ): Promise<Volunteer | null> {
    await volunteerService.syncWithDb();
    return getVolunteer(identity);
  },

  compressAvatar(file: File): Promise<File> {
    return imageCompression(file, {
      maxSizeMB: 0.25,
      maxWidthOrHeight: 400,
      useWebWorker: true,
      fileType: "image/webp",
    });
  },
};
