"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { useWardStore } from "@/store/useWardStore";
import {
  authService,
  UpdateProfilePayload,
} from "@/features/auth/services/auth.service";
import { AuthUser } from "@/features/auth/types";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/get-started",
  "/forgot-password",
  "/credits",
  "/contact",
];

export const useAuth = () => {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const setOverrideWardId = useWardStore((s) => s.setOverrideWardId);

  // 1. Session Query
  const { data: authUser, isLoading: isLoadingAuth } =
    useQuery<AuthUser | null>({
      queryKey: ["authUser"],
      queryFn: authService.getMe,
      staleTime: 5 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    });

  const isAuthenticated = Boolean(authUser);

  // 2. Client-Side Security Guardrail
  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

    if (!isLoadingAuth && !authUser && !isPublicRoute) {
      router.replace("/login");
    }
  }, [isLoadingAuth, authUser, pathname, router]);

  // 3. Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      authService.updateProfile(payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["authUser"], updatedUser);

      if (updatedUser?.wardNumber) {
        setOverrideWardId(updatedUser.wardNumber);
      }
    },
  });

  // 4. Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.clear();
      setOverrideWardId(null);
      router.push("/login");
      router.refresh();
    },
  });

  return {
    authUser,
    isLoadingAuth,
    isAuthenticated,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
};
