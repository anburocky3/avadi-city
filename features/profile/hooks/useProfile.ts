"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "@/features/auth/types";
import { profileService } from "@/features/profile/services/profile.service";
import type { ProfileFormData } from "@/features/profile/types";
import type { Volunteer } from "@/types/volunteer";

interface UseProfileOptions {
  authUser: AuthUser | null | undefined;
  updateProfile: (
    updatedData: Partial<AuthUser>,
    avatarFile?: File | null,
  ) => Promise<void>;
}

const getFormData = (
  authUser: AuthUser | null | undefined,
): ProfileFormData => ({
  name: authUser?.name || "",
  dob: authUser?.dob
    ? new Date(authUser.dob).toISOString().split("T")[0]
    : "2000-01-01",
  bloodGroup: authUser?.bloodGroup || "O+",
  gender: authUser?.gender || "Male",
  phone: authUser?.phone || "",
  email: authUser?.email || "",
});

export function useProfile({ authUser, updateProfile }: UseProfileOptions) {
  const [formData, setFormData] = useState<ProfileFormData>(() =>
    getFormData(authUser),
  );
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    authUser?.avatar || null,
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [volunteerState, setVolunteerState] = useState<{
    userId: string;
    record: Volunteer | null;
  } | null>(null);

  const resetForm = useCallback(() => {
    setFormData(getFormData(authUser));
    setPreviewUrl(authUser?.avatar || null);
    setSelectedAvatarFile(null);
  }, [authUser]);

  const setField = useCallback(
    <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
      setFormData((previous) => ({ ...previous, [field]: value }));
    },
    [],
  );

  const handleAvatarChange = useCallback(async (file?: File) => {
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressedFile = await profileService.compressAvatar(file);
      setSelectedAvatarFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("Compression failed:", error);
      window.alert("Could not process image. Please try a different photo.");
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await updateProfile(formData, selectedAvatarFile);
      return true;
    } catch (error) {
      console.error("Failed to update profile", error);
      window.alert("Failed to update profile. Please try again.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedAvatarFile, updateProfile]);

  useEffect(() => {
    if (!authUser) return;

    let active = true;
    const identity = {
      id: authUser.id,
      phone: authUser.phone,
      name: authUser.name,
    };

    const loadVolunteer = async () => {
      try {
        const volunteer = await profileService.syncVolunteer(identity);
        if (active) {
          setVolunteerState({ userId: authUser.id, record: volunteer });
        }
      } catch (error) {
        console.error("Failed to load volunteer record in profile:", error);
      }
    };

    void loadVolunteer();
    window.addEventListener("focus", loadVolunteer);
    return () => {
      active = false;
      window.removeEventListener("focus", loadVolunteer);
    };
  }, [authUser]);

  useEffect(
    () => () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const volunteerRecord =
    authUser && volunteerState?.userId === authUser.id
      ? (volunteerState.record ?? null)
      : null;
  const status = (volunteerRecord?.status || "").trim().toLowerCase();

  return {
    formData,
    setField,
    resetForm,
    selectedAvatarFile,
    previewUrl,
    isCompressing,
    isSubmitting,
    volunteerRecord,
    isVolunteer: status === "active" || status === "approved",
    isPendingVolunteer: status === "pending",
    handleAvatarChange,
    saveProfile,
  };
}
