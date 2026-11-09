import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationState {
  alerts: any[];
  dismissedAlerts: Array<string | number>;
  readAlerts: Array<string | number>;
  subscribeMyWard: boolean;
  dismissAlert: (id: string | number) => void;
  markAlertAsRead: (id: string | number) => void;
  setSubscribeMyWard: (value: boolean) => void;
  setAlerts: (alerts: any[]) => void;
  resetNotifications: () => void;
}

const initialState = {
  alerts: [],
  dismissedAlerts: [],
  readAlerts: [],
  subscribeMyWard: false,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      ...initialState,
      dismissAlert: (id) =>
        set((state) => ({
          dismissedAlerts: state.dismissedAlerts.includes(id)
            ? state.dismissedAlerts
            : [...state.dismissedAlerts, id],
        })),
      markAlertAsRead: (id) =>
        set((state) => ({
          readAlerts: state.readAlerts.includes(id)
            ? state.readAlerts
            : [...state.readAlerts, id],
        })),
      setSubscribeMyWard: (subscribeMyWard) => set({ subscribeMyWard }),
      setAlerts: (alerts) => set({ alerts }),
      resetNotifications: () => set(initialState),
    }),
    { name: "notification-preferences" },
  ),
);
