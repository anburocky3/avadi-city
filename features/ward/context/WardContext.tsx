"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getWardHints, getWardName, wards as wardList } from "@/data/wards";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useFeeds } from "@/features/feeds/hooks/useFeeds";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useVolunteers } from "@/features/volunteers/hooks/useVolunteers";
import { useBloodRequests } from "@/features/sos/hooks/useBloodRequests";
import { useLocalServices } from "@/features/local-services/hooks/useLocalServices";
import { useWardStore } from "@/store/useWardStore";
import type { AuthUser } from "@/features/auth/types";
import type { WardContextType } from "@/features/ward/types";

export const APP_VERSION = "v1.0.0";
const WardContext = createContext<WardContextType | undefined>(undefined);

export function WardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authUser, isLoadingAuth, isAuthenticated, updateProfile, logout } = useAuth();
  const { overrideWardId, setOverrideWardId } = useWardStore();
  const feeds = useFeeds(authUser, isAuthenticated);
  const complaints = useComplaints();
  const volunteers = useVolunteers();
  const bloodRequests = useBloodRequests(authUser?.bloodGroup);
  const localServices = useLocalServices();

  const activeWardId = overrideWardId || authUser?.wardNumber || 14;
  const isMatchingUserWard = activeWardId === authUser?.wardNumber;
  const activeWard = useMemo(() => ({
    id: activeWardId,
    name: authUser?.streetName && isMatchingUserWard ? authUser.streetName : getWardName(activeWardId),
    hints: authUser?.streetName && isMatchingUserWard ? authUser.streetName : getWardHints(activeWardId),
  }), [activeWardId, authUser, isMatchingUserWard]);
  const userProfile = useMemo(() => authUser
    ? { name: authUser.name, wardNumber: authUser.wardNumber, avatar: authUser.avatar }
    : { name: "Guest", wardNumber: activeWardId, avatar: "/default-avatar.png" },
  [activeWardId, authUser]);

  const value = useMemo<WardContextType>(() => ({
    ...feeds,
    ...complaints,
    ...volunteers,
    ...bloodRequests,
    ...localServices,
    activeWard,
    userProfile,
    updateProfile: async (data, avatarFile) => {
      await updateProfile({ updatedData: data, avatarFile });
    },
    wards: wardList.map(({ id, name }) => ({ id, name })),
    selectWard: (wardId) => {
      const id = Number(wardId);
      if (!wardList.some((ward) => ward.id === id)) return;
      setOverrideWardId(id);
      queryClient.setQueryData<AuthUser | null>(["authUser"], (currentUser) =>
        currentUser ? { ...currentUser, wardNumber: id } : currentUser,
      );
      router.refresh();
    },
    alerts: [],
    readAlerts: [],
    dismissedAlerts: [],
    authUser,
    isLoadingAuth,
    isAuthenticated,
    logout,
  }), [
    activeWard, authUser, bloodRequests, complaints, feeds, isAuthenticated,
    isLoadingAuth, localServices, logout, queryClient, router, setOverrideWardId,
    updateProfile, userProfile, volunteers,
  ]);

  return <WardContext.Provider value={value}>{children}</WardContext.Provider>;
}

export function useWard(): WardContextType {
  const context = useContext(WardContext);
  if (!context) throw new Error("useWard must be used within a WardProvider");
  return context;
}
