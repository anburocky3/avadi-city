"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWard } from "@/context/wardContext";
import { useNotificationStore } from "@/store/useNotificationStore";
import {
  getClaimNotifications,
  updateClaimNotification,
} from "@/features/notifications/services/notification.service";
import type {
  Alert,
  ClaimNotification,
  RevealedPhone,
} from "@/features/notifications/types";

const EMPTY_CLAIMS: ClaimNotification[] = [];

interface NotificationContextValue {
  alerts: Alert[];
  dismissedAlerts: Array<string | number>;
  readAlerts: Array<string | number>;
  subscribeMyWard: boolean;
  setSubscribeMyWard: (value: boolean) => void;
  dismissAlert: (id: string | number) => void;
  markAlertAsRead: (id: string | number) => void;
  incomingClaims: ClaimNotification[];
  outgoingClaims: ClaimNotification[];
  pendingIncoming: ClaimNotification[];
  acceptedOutgoing: ClaimNotification[];
  isLoadingIncoming: boolean;
  isLoadingOutgoing: boolean;
  actioningClaimId: string | null;
  revealedPhones: Record<string, RevealedPhone>;
  handleClaimAction: (
    claimId: string,
    action: "ACCEPTED" | "REJECTED",
  ) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useWard();
  const notificationState = useNotificationStore();
  const [revealedPhones, setRevealedPhones] = useState<
    Record<string, RevealedPhone>
  >({});
  const [actioningClaimId, setActioningClaimId] = useState<string | null>(null);

  const incomingQuery = useQuery({
    queryKey: ["lost-found-claims-owner-notifications"],
    queryFn: () => getClaimNotifications("owner"),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });
  const outgoingQuery = useQuery({
    queryKey: ["lost-found-claims-requester-notifications"],
    queryFn: () => getClaimNotifications("requester"),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });
  const claimMutation = useMutation({
    mutationFn: ({
      claimId,
      action,
    }: {
      claimId: string;
      action: "ACCEPTED" | "REJECTED";
    }) => updateClaimNotification(claimId, action),
    onSuccess: (_data, variables) => {
      if (
        variables.action === "ACCEPTED" &&
        _data.requesterName &&
        _data.requesterPhone
      ) {
        setRevealedPhones((current) => ({
          ...current,
          [variables.claimId]: {
            name: _data.requesterName!,
            phone: _data.requesterPhone!,
          },
        }));
      }
      void queryClient.invalidateQueries({
        queryKey: ["lost-found-claims-owner-notifications"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["lost-found-claims-requester-notifications"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["lost-found-claims-badge"],
      });
    },
  });

  const incomingClaims = incomingQuery.data ?? EMPTY_CLAIMS;
  const outgoingClaims = outgoingQuery.data ?? EMPTY_CLAIMS;
  const value = useMemo<NotificationContextValue>(
    () => ({
      alerts: notificationState.alerts,
      dismissedAlerts: notificationState.dismissedAlerts,
      readAlerts: notificationState.readAlerts,
      subscribeMyWard: notificationState.subscribeMyWard,
      setSubscribeMyWard: notificationState.setSubscribeMyWard,
      dismissAlert: notificationState.dismissAlert,
      markAlertAsRead: notificationState.markAlertAsRead,
      incomingClaims,
      outgoingClaims,
      pendingIncoming: incomingClaims.filter(
        (claim) => claim.status === "PENDING",
      ),
      acceptedOutgoing: outgoingClaims.filter(
        (claim) => claim.status === "ACCEPTED",
      ),
      isLoadingIncoming: incomingQuery.isLoading,
      isLoadingOutgoing: outgoingQuery.isLoading,
      actioningClaimId,
      revealedPhones,
      handleClaimAction: async (claimId, action) => {
        setActioningClaimId(claimId);
        try {
          await claimMutation.mutateAsync({ claimId, action });
        } finally {
          setActioningClaimId(null);
        }
      },
    }),
    [
      actioningClaimId,
      claimMutation,
      incomingClaims,
      incomingQuery.isLoading,
      notificationState,
      outgoingClaims,
      outgoingQuery.isLoading,
      revealedPhones,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  return context;
}
