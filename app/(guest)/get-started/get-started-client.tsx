"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  Key,
  MapPin,
  ShieldAlert,
  Loader2,
  LocateFixed,
  CheckCircle2,
  Building2,
  X,
  Search,
  AlertCircle,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { validateAndMatchAvadiLocation } from "@/lib/location-matcher";
import { ALL_AVADI_STREETS, StreetItem } from "@/lib/wards";
import Link from "next/link";
import {
  stepContactSchema,
  stepOtpSchema,
  stepPersonalSchema,
  stepWardSchema,
} from "@/lib/validations/onboarding";

// --- TYPES ---
type StepContactData = zod.infer<typeof stepContactSchema>;
type StepOtpData = zod.infer<typeof stepOtpSchema>;
type StepPersonalData = zod.infer<typeof stepPersonalSchema>;
type StepWardData = zod.infer<typeof stepWardSchema>;

type MasterFormData = Partial<
  StepContactData & StepPersonalData & StepWardData
>;

type NotificationPromptStatus =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export default function GetStartedClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email");

  // 3-Step Flow: "contact" -> "personal" -> "location"
  const [step, setStep] = useState<"contact" | "personal" | "location">(
    "contact",
  );
  const [formData, setFormData] = useState<MasterFormData>({
    email: prefilledEmail || "",
  });

  // API & Network States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Step 1 Inline OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("1234");
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [resendCountdown, setResendCountdown] = useState(30);

  // Step 3 Location & Ward Mapping States
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [locationError, setLocationError] = useState("");
  const [autoMatchedWard, setAutoMatchedWard] = useState<{
    id: number;
    name: string;
    streetName: string;
    hints: string;
  } | null>(null);
  const [outOfBoundsMsg, setOutOfBoundsMsg] = useState<{
    title: string;
    desc: string;
  } | null>(null);

  const [streetQuery, setStreetQuery] = useState("");
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);
  const [selectedStreetItem, setSelectedStreetItem] =
    useState<StreetItem | null>(null);

  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const getEighteenYearsAgoDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split("T")[0];
  };

  // --- FORM HOOKS SETUP ---

  const {
    register: registerContact,
    handleSubmit: handleSubmitContact,
    getValues: getValuesContact,
    setValue: setValueContact,
    formState: { errors: errorsContact, isValid: isValidContact },
  } = useForm<StepContactData>({
    resolver: zodResolver(stepContactSchema),
    mode: "onChange",
    defaultValues: {
      phone: "",
      email: prefilledEmail || "",
    },
  });

  useEffect(() => {
    if (prefilledEmail) {
      setValueContact("email", prefilledEmail, { shouldValidate: true });
      setFormData((prev) => ({ ...prev, email: prefilledEmail }));
    }
  }, [prefilledEmail, setValueContact]);

  const {
    setValue: setValueOtp,
    formState: { errors: errorsOtp },
  } = useForm<StepOtpData>({
    resolver: zodResolver(stepOtpSchema),
    mode: "onChange",
  });

  const {
    register: registerPersonal,
    handleSubmit: handleSubmitPersonal,
    setValue: setValuePersonal,
    watch: watchPersonal,
    formState: { errors: errorsPersonal, isValid: isValidPersonal },
  } = useForm<StepPersonalData>({
    resolver: zodResolver(stepPersonalSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      password: "",
      gender: "Male",
      dob: getEighteenYearsAgoDate(),
      bloodGroup: "O+",
    },
  });

  const {
    setValue: setValueWard,
    watch: watchWard,
    formState: { isValid: isValidWard },
  } = useForm<StepWardData>({
    resolver: zodResolver(stepWardSchema),
    mode: "onChange",
    defaultValues: {
      wardNumber: 0,
      streetName: "",
    },
  });

  const currentWardNumber = watchWard("wardNumber");
  const currentStreetName = watchWard("streetName");

  // --- HANDLERS ---

  const handleSendOtp = async (data: StepContactData) => {
    setIsSubmitting(true);
    setApiError("");
    try {
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const checkResult = await checkRes.json();

      if (checkRes.ok && checkResult.exists) {
        throw new Error("Email or mobile number is already registered.");
      }

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to send verification code.");
      }

      if (result.demoOtp) {
        setDemoOtp(result.demoOtp);
      }

      setFormData((prev) => ({ ...prev, ...data }));
      setOtpSent(true);
      setResendCountdown(30);
    } catch (err: any) {
      setApiError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);

    const combinedOtp = newOtp.join("");
    setValueOtp("otp", combinedOtp, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendOtp = async () => {
    const contactData = getValuesContact();
    if (!contactData.email || !contactData.phone) return;
    setIsSubmitting(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to resend code.");
      setResendCountdown(30);
    } catch (err: any) {
      setApiError(err.message || "Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonalSubmit = (data: StepPersonalData) => {
    setApiError("");
    setFormData((prev) => ({ ...prev, ...data }));
    setStep("location");
  };

  const handleStreetSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStreetQuery(value);
    setSelectedStreetItem(null);

    if (!value.trim()) {
      setStreetResults([]);
      return;
    }

    const searchTerm = value.toLowerCase().trim();
    const filtered = ALL_AVADI_STREETS.filter((item) =>
      item.streetName.toLowerCase().includes(searchTerm),
    ).slice(0, 15);

    setStreetResults(filtered);
  };

  const handleSelectStreetItem = (item: StreetItem) => {
    setSelectedStreetItem(item);
    setStreetQuery(item.streetName);
    setStreetResults([]);

    setValueWard("wardNumber", item.wardNo, { shouldValidate: true });
    setValueWard("streetName", item.streetName, { shouldValidate: true });
    setFormData((prev) => ({
      ...prev,
      wardNumber: item.wardNo,
      streetName: item.streetName,
    }));
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError("");
    setOutOfBoundsMsg(null);
    setAutoMatchedWard(null);
    setLocationStatus("Acquiring satellite / GPS lock...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          setLocationStatus("Translating GPS coordinates...");

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en-US,en;q=0.9" } },
          );

          if (!res.ok) throw new Error("Failed to resolve address.");

          const data = await res.json();
          setLocationStatus("Verifying municipal boundaries...");

          const result = validateAndMatchAvadiLocation(
            data.address || {},
            accuracy,
          );

          if (
            result.status === "LOW_ACCURACY" ||
            result.status === "OUT_OF_BOUNDS"
          ) {
            setOutOfBoundsMsg({
              title: "Location Notice",
              desc: `Could not verify exact Avadi coordinates. Please select your street manually below.`,
            });
          } else if (result.status === "EXACT_MATCH" && result.match) {
            const matchedWardObj = {
              id: result.match.wardNo,
              name: result.match.wardCode || `Ward ${result.match.wardNo}`,
              streetName: result.match.streetName,
              hints: `GPS verified in Avadi (${result.match.streetName})`,
            };
            setAutoMatchedWard(matchedWardObj);
            setValueWard("wardNumber", result.match.wardNo, {
              shouldValidate: true,
            });
            setValueWard("streetName", result.match.streetName, {
              shouldValidate: true,
            });
            setFormData((prev) => ({
              ...prev,
              wardNumber: result.match!.wardNo,
              streetName: result.match!.streetName,
            }));
          }
        } catch {
          setLocationError(
            "Could not verify GPS location. Please choose manually.",
          );
        } finally {
          setIsLocating(false);
          setLocationStatus("");
        }
      },
      () => {
        setIsLocating(false);
        setLocationStatus("");
        setLocationError(
          "Location permission denied. Please pick your ward manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!isValidWard) return;
    setApiError("");

    let notificationStatus: NotificationPromptStatus = "unsupported";

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        setIsRequestingPermission(true);
        try {
          notificationStatus = await Notification.requestPermission();
        } catch {
          notificationStatus = "denied";
        } finally {
          setIsRequestingPermission(false);
        }
      } else {
        notificationStatus = Notification.permission;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        wardNumber: currentWardNumber,
        streetName: currentStreetName,
        notification_enabled: notificationStatus === "granted",
        notification_permission: notificationStatus,
      };

      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to complete registration.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setApiError(err.message || "An unexpected error occurred while saving.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (otpSent && resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown((prev) => prev - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [otpSent, resendCountdown]);

  const stepsOrder = ["contact", "personal", "location"];
  const currentStepIdx = stepsOrder.indexOf(step);

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center sm:py-8 sm:px-4 transition-colors duration-300 font-sans select-none">
      <div className="w-full sm:max-w-md min-h-screen sm:min-h-0 bg-white dark:bg-slate-900 sm:border sm:border-slate-200/80 dark:sm:border-slate-800/80 sm:rounded-[36px] shadow-none sm:shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 relative">
        {/* Top App Header & Segmented Progress */}
        <div className="pt-6 pb-5 px-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={"/logo.png"}
                  alt="AVADI CITY Logo"
                  className="w-full h-full object-cover object-center rounded-xl"
                />
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
                  AVADI <span className="text-primary font-black">CITY</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider uppercase block">
                  Citizen Setup · Step {currentStepIdx + 1} of 3
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              title="Cancel setup"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {stepsOrder.map((st, idx) => (
              <div
                key={st}
                className={`h-2 rounded-full transition-all duration-500 ${
                  idx <= currentStepIdx
                    ? "bg-primary shadow-xs shadow-primary/30"
                    : "bg-slate-200/80 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Global API Error Alert Banner */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center space-x-2.5 text-rose-600 dark:text-rose-400 text-xs font-bold"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span className="flex-1 leading-snug">{apiError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1: CONTACT DETAILS & INLINE OTP VERIFICATION */}
            {step === "contact" && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {otpSent ? "Verify code" : "Get started with your phone"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    {otpSent
                      ? `We sent a 4-digit verification code to ${getValuesContact().email}`
                      : "We use your mobile number and email to securely verify your identity and deliver critical ward emergency alerts."}
                  </p>
                </div>

                {!otpSent ? (
                  <form
                    onSubmit={handleSubmitContact(handleSendOtp)}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Email Address *
                      </label>
                      <div className="relative mt-2">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Mail size={18} />
                        </span>
                        <input
                          type="email"
                          placeholder="yourname@example.com"
                          {...registerContact("email")}
                          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-sm font-medium transition"
                        />
                      </div>
                      <small className="block text-[11px] text-slate-400 dark:text-slate-500 font-medium pl-1 pt-1">
                        Email OTP will be sent to this email
                      </small>
                      {errorsContact.email && (
                        <p className="text-xs text-rose-500 font-bold pl-1">
                          {errorsContact.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Mobile Number *
                      </label>
                      <div className="relative mt-2">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Phone size={18} />
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit phone (e.g. 9876543210)"
                          {...registerContact("phone")}
                          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-sm font-medium transition"
                        />
                      </div>
                      {errorsContact.phone && (
                        <p className="text-xs text-rose-500 font-bold pl-1">
                          {errorsContact.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={!isValidContact || isSubmitting}
                        className="w-full h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Checking & Sending Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send OTP Code</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const code = otpValues.join("");
                      if (code.length !== 4) return;

                      setIsSubmitting(true);
                      setApiError("");
                      try {
                        const contactData = getValuesContact();
                        const res = await fetch("/api/auth/verify-otp", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: contactData.email,
                            otp: code,
                          }),
                        });
                        const result = await res.json();

                        if (!res.ok) {
                          throw new Error(
                            result.error || "Invalid verification code.",
                          );
                        }

                        setFormData((prev) => ({ ...prev, ...contactData }));
                        setStep("personal");
                      } catch (err: any) {
                        setApiError(
                          err.message ||
                            "Verification failed. Please try again.",
                        );
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="space-y-6 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between px-4">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                        Demo Dev Code:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const digits = demoOtp.split("");
                          setOtpValues(digits);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black tracking-widest transition shadow-sm cursor-pointer"
                      >
                        {demoOtp} (Click to Fill)
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-center space-x-3 sm:space-x-4 mt-2">
                        {[0, 1, 2, 3].map((index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={otpValues[index]}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-13 h-13 sm:w-14 sm:h-14 text-center text-xl font-extrabold rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition shadow-xs"
                          />
                        ))}
                      </div>

                      <div className="text-center pt-1">
                        {resendCountdown > 0 ? (
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            Resend code in{" "}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {resendCountdown}s
                            </strong>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleResendOtp}
                            className="text-xs text-primary hover:underline font-bold cursor-pointer disabled:opacity-50"
                          >
                            {isSubmitting
                              ? "Resending..."
                              : "Resend Verification Code"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setOtpSent(false)}
                        className="h-13 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition text-sm flex items-center justify-center cursor-pointer"
                        title="Change details"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <button
                        type="submit"
                        disabled={
                          otpValues.join("").length !== 4 || isSubmitting
                        }
                        className="flex-1 h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify & Proceed</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* STEP 2: PERSONAL DETAILS & PASSWORD */}
            {step === "personal" && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Tell us about yourself
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    Provide your identity details and set a secure password for
                    future logins.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmitPersonal(handlePersonalSubmit)}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Full Name *
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <User size={18} />
                      </span>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        {...registerPersonal("name")}
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-sm font-medium transition"
                      />
                    </div>
                    {errorsPersonal.name && (
                      <p className="text-xs text-rose-500 font-bold pl-1">
                        {errorsPersonal.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Secure Password *
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Key size={18} />
                      </span>
                      <input
                        type="password"
                        placeholder="Create a password (min 6 chars)"
                        {...registerPersonal("password")}
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-sm font-medium transition"
                      />
                    </div>
                    {errorsPersonal.password && (
                      <p className="text-xs text-rose-500 font-bold pl-1">
                        {errorsPersonal.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 w-full max-w-full">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Date of Birth *
                    </label>
                    <div className="w-full max-w-full overflow-hidden mt-2">
                      <input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        {...registerPersonal("dob")}
                        className="w-full max-w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium cursor-pointer transition box-border appearance-none block"
                      />
                    </div>
                    {errorsPersonal.dob && (
                      <p className="text-xs text-rose-500 font-bold pl-1">
                        {errorsPersonal.dob.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Blood Group *
                    </label>
                    <select
                      {...registerPersonal("bloodGroup")}
                      className="mt-2 w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-sm font-medium cursor-pointer transition"
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ),
                      )}
                    </select>
                    {errorsPersonal.bloodGroup && (
                      <p className="text-xs text-rose-500 font-bold pl-1">
                        {errorsPersonal.bloodGroup.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Gender *
                    </label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {["Male", "Female", "Other"].map((g) => {
                        const selectedGender = watchPersonal("gender");
                        const isSelected = selectedGender === g;
                        return (
                          <label
                            key={g}
                            className={`flex items-center justify-center h-12 rounded-2xl border text-sm font-bold cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary bg-orange-50/80 dark:bg-orange-950/30 text-primary ring-2 ring-primary/20 shadow-xs"
                                : "border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <input
                              type="radio"
                              value={g}
                              {...registerPersonal("gender")}
                              className="sr-only"
                              onChange={() =>
                                setValuePersonal("gender", g as any, {
                                  shouldValidate: true,
                                })
                              }
                            />
                            <span className="flex items-center gap-1.5">
                              {isSelected && (
                                <Check size={14} className="stroke-3" />
                              )}
                              <span>{g}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {errorsPersonal.gender && (
                      <p className="text-xs text-rose-500 font-bold pl-1">
                        {errorsPersonal.gender.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep("contact")}
                      className="h-13 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition text-sm flex items-center justify-center cursor-pointer"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={!isValidPersonal}
                      className="flex-1 h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 3: WARD & LOCATION SELECTION */}
            {step === "location" && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Choose your ward
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    Search your street to map your ward for localized civic
                    alerts.
                  </p>
                </div>

                {isLocating && locationStatus && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center space-x-2.5 text-primary text-xs font-bold animate-pulse">
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span>{locationStatus}</span>
                  </div>
                )}

                {locationError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed">
                    {locationError}
                  </div>
                )}

                {outOfBoundsMsg && (
                  <div className="p-4 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-2xl text-left space-y-1.5">
                    <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <ShieldAlert size={16} />
                      <span>{outOfBoundsMsg.title}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {outOfBoundsMsg.desc}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {autoMatchedWard ? (
                    <div className="p-5 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-center space-y-1.5 shadow-xs">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                        <CheckCircle2 size={22} />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider font-black text-emerald-600 dark:text-emerald-400">
                        Verified GPS Location
                      </p>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        Ward {autoMatchedWard.id}
                      </h3>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {autoMatchedWard.streetName}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAutoMatchedWard(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold underline pt-1 inline-block cursor-pointer"
                      >
                        Change mapped ward
                      </button>
                    </div>
                  ) : selectedStreetItem ? (
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-1.5 shadow-xs">
                      <p className="text-[10px] uppercase tracking-wider font-black text-emerald-600 dark:text-emerald-400">
                        Selected Street
                      </p>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        Ward {selectedStreetItem.wardNo}
                      </h3>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                        {selectedStreetItem.streetName}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStreetItem(null);
                          setStreetQuery("");
                          setValueWard("wardNumber", 0, {
                            shouldValidate: true,
                          });
                          setValueWard("streetName", "", {
                            shouldValidate: true,
                          });
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold underline pt-1 inline-block cursor-pointer"
                      >
                        Search a different street
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="relative mt-2">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Search size={18} />
                        </span>
                        <input
                          type="text"
                          value={streetQuery}
                          onChange={handleStreetSearchChange}
                          placeholder="Search street (e.g. MTH Road, Kamaraj Nagar)..."
                          className="w-full h-12 pl-11 pr-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 font-medium text-base sm:text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition shadow-2xs"
                        />
                        {streetQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setStreetQuery("");
                              setStreetResults([]);
                            }}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      {streetResults.length > 0 && (
                        <ul className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 shadow-xl max-h-56 overflow-y-auto text-left">
                          {streetResults.map((item) => (
                            <li
                              key={item.id}
                              onClick={() => handleSelectStreetItem(item)}
                              className="p-3.5 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 cursor-pointer flex items-start gap-3 transition group"
                            >
                              <div className="p-2 rounded-xl bg-orange-100/70 dark:bg-orange-950/40 text-primary shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition shadow-2xs">
                                <MapPin size={16} />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">
                                  {item.streetName.toLocaleLowerCase("en-IN")}
                                </p>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary text-[11px] font-extrabold transition">
                                  <Building2 size={12} className="shrink-0" />
                                  <span>Ward {item.wardNo}</span>
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="pt-1">
                        <button
                          type="button"
                          disabled={isLocating}
                          onClick={handleRequestLocation}
                          className="w-full h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          <LocateFixed size={16} className="text-primary" />
                          <span>Detect Ward Using GPS</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep("personal")}
                      className="h-13 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition text-sm flex items-center justify-center cursor-pointer"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="button"
                      disabled={
                        !isValidWard || isSubmitting || isRequestingPermission
                      }
                      onClick={handleCompleteOnboarding}
                      className="flex-1 h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                    >
                      {isRequestingPermission || isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>
                            {isRequestingPermission
                              ? "Requesting Permission..."
                              : "Saving Profile..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>Confirm & Finish</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom App Footer Shell */}
        <div className="py-4 px-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-center">
          <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400 dark:text-slate-500">
            back to{" "}
            <Link href="/" className="text-primary hover:underline">
              Home page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
