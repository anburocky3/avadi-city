import { track } from "@vercel/analytics";

/**
 * Universal safe event tracking for Vercel Analytics
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  if (typeof window === "undefined") return;

  try {
    // Sanitize undefined values for Vercel Analytics
    const sanitizedProps: Record<string, string | number | boolean | null> = {};
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value !== undefined) {
          sanitizedProps[key] = value;
        }
      }
    }

    track(eventName, sanitizedProps);
  } catch (error) {
    // Graceful silent fallback
    console.debug(`[Analytics] Failed to track "${eventName}":`, error);
  }
}

/**
 * Common Civic App Analytics Events
 */
export const AnalyticsEvents = {
  // Navigation & User Engagement
  PAGE_VIEW: "page_view",
  THEME_TOGGLE: "theme_toggle",
  LOCALE_CHANGE: "locale_change",
  PWA_INSTALL_CLICK: "pwa_install_click",

  // 24/7 Emergency & SOS
  SOS_CALL_DIALED: "sos_call_dialed",
  SOS_SIREN_TOGGLED: "sos_siren_toggled",
  SOS_GPS_SHARED: "sos_gps_shared",
  SOS_BLOOD_REQUEST: "sos_blood_request_dispatched",

  // Civic Grievances & Municipal
  COMPLAINT_SUBMITTED: "complaint_submitted",
  COMPLAINT_FILTERED: "complaint_filtered",
  WARD_FEED_POST: "ward_feed_post_created",
  LOST_FOUND_POST: "lost_found_item_posted",

  // Commerce & City Directory
  FOOD_RESTAURANT_CALLED: "food_restaurant_called",
  FOOD_SUBMISSION: "food_submission_created",
  SERVICE_PRO_CALLED: "service_pro_called",
  RENTAL_CONTACT_CLICKED: "rental_contact_clicked",
  HEALTHCARE_DIRECTORY_VIEWED: "healthcare_directory_viewed",

  // Admin Portal
  ADMIN_LOGIN: "admin_login_success",
  ADMIN_LISTING_APPROVED: "admin_listing_approved",
  ADMIN_LISTING_REJECTED: "admin_listing_rejected",
  ADMIN_PUSH_BROADCAST: "admin_push_broadcast_sent",
} as const;

// Helper dispatchers
export const trackSosDial = (title: string, number: string) => {
  trackEvent(AnalyticsEvents.SOS_CALL_DIALED, {
    service_title: title,
    contact_number: number,
  });
};

export const trackComplaintCreation = (category: string, wardId: number | string) => {
  trackEvent(AnalyticsEvents.COMPLAINT_SUBMITTED, {
    category,
    ward_id: String(wardId),
  });
};

export const trackBloodBroadcast = (bloodGroup: string, hospital: string) => {
  trackEvent(AnalyticsEvents.SOS_BLOOD_REQUEST, {
    blood_group: bloodGroup,
    hospital_name: hospital,
  });
};

export const trackBusinessContact = (
  type: "food" | "service" | "rental",
  itemName: string,
  contactNumber?: string
) => {
  const event =
    type === "food"
      ? AnalyticsEvents.FOOD_RESTAURANT_CALLED
      : type === "service"
      ? AnalyticsEvents.SERVICE_PRO_CALLED
      : AnalyticsEvents.RENTAL_CONTACT_CLICKED;

  trackEvent(event, {
    item_name: itemName,
    contact_number: contactNumber || "direct",
  });
};
