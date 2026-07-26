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
  Bell,
  ShieldAlert,
  BellRing,
  Loader2,
  LocateFixed,
  CheckCircle2,
  Building2,
  X,
  Search,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { validateAndMatchAvadiLocation } from "@/lib/location-matcher";
import { ALL_AVADI_STREETS, StreetItem } from "@/lib/wards";

// --- ZOD VALIDATION SCHEMAS ---

const stepOneSchema = zod.object({
  name: zod
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  gender: zod.enum(["Male", "Female", "Other"], {
    message: "Please select your gender",
  }),
  dob: zod
    .string()
    .min(1, { message: "Date of birth is required" })
    .refine((date) => new Date(date) <= new Date(), {
      message: "Date of birth cannot be in the future",
    }),
  bloodGroup: zod.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
    message: "Please select your blood group",
  }),
});

const stepTwoSchema = zod.object({
  phone: zod.string().regex(/^[6-9]\d{9}$/, {
    message: "Enter a valid 10-digit Indian mobile number",
  }),
  email: zod.email({ message: "Enter a valid email address" }),
});

const stepOtpSchema = zod.object({
  otp: zod
    .string()
    .length(4, { message: "Please enter the complete 4-digit code" }),
});

const stepWardSchema = zod.object({
  wardNumber: zod.number().min(1, { message: "Please select your Ward" }),
  streetName: zod
    .string()
    .min(3, { message: "Street name must be at least 3 characters" })
    .max(100, { message: "Street name is too long" }),
});

// --- TYPES ---
type StepOneData = zod.infer<typeof stepOneSchema>;
type StepTwoData = zod.infer<typeof stepTwoSchema>;
type StepOtpData = zod.infer<typeof stepOtpSchema>;
type StepWardData = zod.infer<typeof stepWardSchema>;

// Consolidated Master Form Data Type
type MasterFormData = Partial<StepOneData & StepTwoData & StepWardData>;

export default function GetStartedPage() {
  const router = useRouter();
  const [step, setStep] = useState("register");
  const [formData, setFormData] = useState<MasterFormData>({});

  // API & Network States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // UI & Location Simulation States
  const [demoOtp, setDemoOtp] = useState("1234");
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [locationError, setLocationError] = useState("");
  const [unmatchedLocality, setUnmatchedLocality] = useState<string | null>(
    null,
  );
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
  const [showManualFallback, setShowManualFallback] = useState(false);

  // --- FORM HOOKS SETUP ---

  // Step 1: Personal Details
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    setValue: setValueStep1,
    watch: watchStep1,
    formState: { errors: errorsStep1, isValid: isValidStep1 },
  } = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    mode: "onChange",
    defaultValues: {
      name: formData.name || "",
      gender: formData.gender,
      dob: formData.dob || "",
      bloodGroup: formData.bloodGroup,
    },
  });

  // Step 2: Contact Details
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2, isValid: isValidStep2 },
  } = useForm<StepTwoData>({
    resolver: zodResolver(stepTwoSchema),
    mode: "onChange",
    defaultValues: {
      phone: formData.phone || "",
      email: formData.email || "",
    },
  });

  // Step 3: OTP Verification
  const {
    setValue: setValueOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: errorsOtp, isValid: isValidOtp },
  } = useForm<StepOtpData>({
    resolver: zodResolver(stepOtpSchema),
    mode: "onChange",
  });

  // Step 4: Ward Selection
  const {
    register: registerWard,
    handleSubmit: handleSubmitWard,
    setValue: setValueWard,
    formState: { errors: errorsWard, isValid: isValidWard },
  } = useForm<StepWardData>({
    resolver: zodResolver(stepWardSchema),
    mode: "onChange",
    defaultValues: {
      wardNumber: formData.wardNumber || 0,
      streetName: formData.streetName || "",
    },
  });

  // --- HANDLERS ---

  const handleStep1Submit = (data: StepOneData) => {
    setApiError("");
    setFormData((prev) => ({ ...prev, ...data }));
    setStep("contact");
  };

  // Step 2 Submit: Calls /api/auth/send-otp
  const handleStep2Submit = async (data: StepTwoData) => {
    setIsSubmitting(true);
    setApiError(""); // Clear previous errors
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        // This will catch "email/mobile is already exist" from our 409 response
        throw new Error(result.error || "Failed to send verification code.");
      }

      // Save demo OTP if returned by server
      if (result.demoOtp) {
        setDemoOtp(result.demoOtp);
      }

      setFormData((prev) => ({ ...prev, ...data }));
      setStep("otp");
      setResendCountdown(30);
    } catch (err: any) {
      // Shows the error banner directly on Step 2
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
    setValueOtp("otp", combinedOtp, { shouldValidate: true });

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

  // Step 3 Submit: Calls /api/auth/verify-otp
  const onVerifyOtpSuccess = async (data: StepOtpData) => {
    setIsSubmitting(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: data.otp }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Invalid verification code.");
      }

      setStep("location");
    } catch (err: any) {
      setApiError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    if (!formData.email || !formData.phone) return;
    setIsSubmitting(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, phone: formData.phone }),
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
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError("");
    setOutOfBoundsMsg(null);
    setUnmatchedLocality(null);
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

          if (result.status === "LOW_ACCURACY") {
            setOutOfBoundsMsg({
              title: "Imprecise Location Detected",
              desc: `We detected your signal near "${result.detectedName}", but accuracy is too low (+${Math.round(accuracy)}m) to pin an exact Avadi ward. Please select manually.`,
            });
          } else if (result.status === "OUT_OF_BOUNDS") {
            setOutOfBoundsMsg({
              title: "Outside Avadi Limits Detected",
              desc: `Your routing shows your location as "${result.detectedName}" (outside Avadi Corporation limits). Please choose your ward manually.`,
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
          } else if (result.status === "PARTIAL_MATCH") {
            setUnmatchedLocality(result.detectedName);
            if (result.detectedName) {
              setValueWard("streetName", result.detectedName, {
                shouldValidate: true,
              });
              setFormData((prev) => ({
                ...prev,
                streetName: result.detectedName,
              }));
            }
          }
        } catch (err: any) {
          console.error("Geocoding Error:", err);
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
          "Location permission denied or unavailable. Please pick your ward manually.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  };

  const handleWardSelectSubmit = (data: StepWardData) => {
    setApiError("");
    setFormData((prev) => ({ ...prev, ...data }));
    setStep("notification");
  };

  // Step 6 Submit: Calls /api/auth/onboarding to save complete profile
  const handleCompleteOnboarding = async (notificationsEnabled: boolean) => {
    setIsSubmitting(true);
    setApiError("");
    try {
      const payload = {
        ...formData,
        notification_enabled: notificationsEnabled,
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

      // Redirect citizen to dashboard after database save succeeds
      router.push("/dashboard");
    } catch (err: any) {
      setApiError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Countdown Timer
  useEffect(() => {
    if (step === "otp" && resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown((prev) => prev - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [step, resendCountdown]);

  // Sample Wards Data
  const wards = [
    { id: "5650", name: "WARD-OOB" },
    { id: "800", name: "WD-01" },
    { id: "801", name: "WD-02" },
    { id: "802", name: "WD-03" },
    { id: "803", name: "WD-04" },
    { id: "804", name: "WD-05" },
    { id: "805", name: "WD-06" },
    { id: "806", name: "WD-07" },
    { id: "807", name: "WD-08" },
    { id: "808", name: "WD-09" },
    { id: "809", name: "WD-10" },
    { id: "810", name: "WD-11" },
    { id: "811", name: "WD-12" },
    { id: "812", name: "WD-13" },
    { id: "813", name: "WD-14" },
    { id: "814", name: "WD-15" },
    { id: "815", name: "WD-16" },
    { id: "816", name: "WD-17" },
    { id: "817", name: "WD-18" },
    { id: "818", name: "WD-19" },
    { id: "819", name: "WD-20" },
    { id: "820", name: "WD-21" },
    { id: "821", name: "WD-22" },
    { id: "822", name: "WD-23" },
    { id: "823", name: "WD-24" },
    { id: "824", name: "WD-25" },
    { id: "825", name: "WD-26" },
    { id: "826", name: "WD-27" },
    { id: "827", name: "WD-28" },
    { id: "828", name: "WD-29" },
    { id: "829", name: "WD-30" },
    { id: "830", name: "WD-31" },
    { id: "831", name: "WD-32" },
    { id: "832", name: "WD-33" },
    { id: "833", name: "WD-34" },
    { id: "834", name: "WD-35" },
    { id: "835", name: "WD-36" },
    { id: "836", name: "WD-37" },
    { id: "837", name: "WD-38" },
    { id: "838", name: "WD-39" },
    { id: "839", name: "WD-40" },
    { id: "840", name: "WD-41" },
    { id: "841", name: "WD-42" },
    { id: "842", name: "WD-43" },
    { id: "843", name: "WD-44" },
    { id: "844", name: "WD-45" },
    { id: "845", name: "WD-46" },
    { id: "846", name: "WD-47" },
    { id: "847", name: "WD-48" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      {/* Container Box */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Top Middle App Logo & Name */}
        <div className="flex flex-col items-center justify-center pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 space-y-2.5">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 p-0.5 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={"/logo.png"}
              alt="AVADI CITY Official Logo"
              className="w-full h-full object-cover object-center rounded-xl"
            />
          </div>
          <div className="text-center">
            <span className="font-black text-lg tracking-tight text-slate-800 dark:text-slate-100 block leading-tight">
              AVADI <span className="text-primary font-black">CITY</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider uppercase mt-0.5 block">
              Quick registration
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {[
          "register",
          "contact",
          "otp",
          "ward",
          "location",
          "notification",
        ].includes(step) && (
          <div className="px-6 md:px-8 mt-5">
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full flex overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${
                    step === "register"
                      ? 16
                      : step === "contact"
                        ? 33
                        : step === "otp"
                          ? 50
                          : step === "location"
                            ? 66
                            : step === "ward"
                              ? 83
                              : 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Global API Error Alert Banner */}
        {apiError && (
          <div className="mx-6 md:mx-8 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-2 text-rose-500 text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{apiError}</span>
          </div>
        )}

        <div className="px-6 pb-6 md:px-8 md:pb-8 pt-5 md:pt-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: PERSONAL DETAILS */}
            {step === "register" && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                  Tell us about yourself
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                  To tailor your ward experience, please provide your basic
                  details.
                </p>

                <form
                  onSubmit={handleSubmitStep1(handleStep1Submit)}
                  className="space-y-5"
                >
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Full Name *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        {...registerStep1("name")}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                    {errorsStep1.name && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errorsStep1.name.message}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      {...registerStep1("dob")}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm cursor-pointer"
                    />
                    {errorsStep1.dob && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errorsStep1.dob.message}
                      </p>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Blood Group *
                    </label>
                    <select
                      {...registerStep1("bloodGroup")}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm cursor-pointer"
                    >
                      <option value="" disabled>
                        Select Blood Group
                      </option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ),
                      )}
                    </select>
                    {errorsStep1.bloodGroup && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errorsStep1.bloodGroup.message}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Gender *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Male", "Female", "Other"].map((g) => {
                        const selectedGender = watchStep1("gender");
                        return (
                          <label
                            key={g}
                            className={`flex items-center justify-center py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                              selectedGender === g
                                ? "border-primary bg-orange-50/50 dark:bg-orange-950/20 text-primary"
                                : "border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="radio"
                              value={g}
                              {...registerStep1("gender")}
                              className="sr-only"
                              onChange={() =>
                                setValueStep1("gender", g as any, {
                                  shouldValidate: true,
                                })
                              }
                            />
                            <span>{g}</span>
                          </label>
                        );
                      })}
                    </div>
                    {errorsStep1.gender && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errorsStep1.gender.message}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={!isValidStep1}
                      className="w-full py-3 bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-primary text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                    >
                      <span>Next</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2: CONTACT DETAILS */}
            {step === "contact" && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                  Verify identity
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                  Specify how you want to be identified or contacted for civic
                  responses.
                </p>

                <form
                  onSubmit={handleSubmitStep2(handleStep2Submit)}
                  className="space-y-5"
                >
                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone size={16} />
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit phone (e.g. 9876543210)"
                        {...registerStep2("phone")}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                    {errorsStep2.phone && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errorsStep2.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Email Address *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        placeholder="yourname@domain.com"
                        {...registerStep2("email")}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                    {errorsStep2.email && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errorsStep2.email.message}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep("register")}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition text-xs flex items-center justify-center cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      type="submit"
                      disabled={!isValidStep2 || isSubmitting}
                      className="flex-1 py-3 bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-primary text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 3: OTP VERIFICATION */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form
                  onSubmit={handleSubmitOtp(onVerifyOtpSuccess)}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Key size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                      Verify Your Email
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
                      We sent a 4-digit verification code to{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formData.email}
                      </span>
                      .
                    </p>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between px-4">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      Demo Dev Code:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        // Auto-fill all 4 input boxes with the demo code (e.g., "1234")
                        const digits = demoOtp.split("");
                        setOtpValues(digits);
                        setValueOtp("otp", demoOtp, { shouldValidate: true });
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black tracking-widest transition shadow-sm cursor-pointer"
                      title="Click to auto-fill OTP"
                    >
                      {demoOtp} (Click to Fill)
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-center space-x-3">
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
                          className="w-12 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                        />
                      ))}
                    </div>

                    {errorsOtp.otp && (
                      <p className="text-[11px] text-rose-500 font-medium text-center">
                        {errorsOtp.otp.message}
                      </p>
                    )}

                    <div className="text-center">
                      {resendCountdown > 0 ? (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Resend code in {resendCountdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleResendOtp}
                          className="text-[11px] text-primary hover:underline font-bold cursor-pointer disabled:opacity-50"
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
                      onClick={() => setStep("contact")}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition text-xs flex items-center justify-center cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      type="submit"
                      disabled={!isValidOtp || isSubmitting}
                      className="flex-1 py-3 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Proceed</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4: LOCATION PERMISSION */}
            {step === "location" && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-3">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      autoMatchedWard
                        ? "bg-emerald-500/10 text-emerald-500"
                        : unmatchedLocality
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-primary/10 text-primary animate-pulse"
                    }`}
                  >
                    <MapPin size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {autoMatchedWard
                      ? "Ward Mapped Successfully!"
                      : unmatchedLocality
                        ? "Location Detected"
                        : "Location Access Required"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {autoMatchedWard
                      ? "We verified your GPS coordinates and automatically pinned your municipal ward."
                      : unmatchedLocality
                        ? `We detected you are near "${unmatchedLocality}", but couldn't pin an exact ward number. Please confirm below.`
                        : "Avadi City requires location permission to map your home ward and verify residency."}
                  </p>
                </div>

                {isLocating && locationStatus && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-center space-x-2 text-primary text-xs font-semibold animate-pulse">
                    <Loader2 size={14} className="animate-spin shrink-0" />
                    <span>{locationStatus}</span>
                  </div>
                )}

                {locationError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[11px] font-medium leading-relaxed">
                    {locationError}
                  </div>
                )}

                {outOfBoundsMsg ? (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div className="p-4 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-2xl text-left space-y-2">
                      <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <ShieldAlert size={16} />
                        <span>{outOfBoundsMsg.title}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {outOfBoundsMsg.desc}
                      </p>
                      <div className="pt-1">
                        <span className="inline-block text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-md font-bold">
                          Tip: Turn on mobile GPS or select street below
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOutOfBoundsMsg(null);
                          setStep("ward");
                        }}
                        className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                      >
                        <span>Proceed to Manual Ward Selection</span>
                        <ArrowRight size={14} />
                      </button>

                      <button
                        type="button"
                        disabled={isLocating}
                        onClick={handleRequestLocation}
                        className="w-full py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold transition cursor-pointer"
                      >
                        Retry GPS Detection
                      </button>
                    </div>
                  </div>
                ) : autoMatchedWard ? (
                  <div className="space-y-4 pt-1">
                    <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-center space-y-1">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
                        Detected Municipal Ward
                      </p>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white">
                        Ward {autoMatchedWard.id}
                      </h3>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {autoMatchedWard.streetName}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        {autoMatchedWard.hints}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep("ward")}
                        className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                      >
                        <span>Confirm Ward & Street</span>
                        <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoMatchedWard(null);
                          setStep("ward");
                        }}
                        className="w-full py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold transition cursor-pointer"
                      >
                        Change Ward Manually
                      </button>
                    </div>
                  </div>
                ) : unmatchedLocality ? (
                  <div className="space-y-4 pt-1">
                    <div className="p-4 bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 rounded-2xl text-center space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">
                        Partial Match
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        Detected Area: {unmatchedLocality}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        We pre-filled your street name. Please select your exact
                        Ward Number from the dropdown on the next screen.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep("ward")}
                      className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                    >
                      <span>Select Ward Number</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 space-y-3">
                    <button
                      type="button"
                      disabled={isLocating}
                      onClick={handleRequestLocation}
                      className="w-full py-3.5 bg-primary hover:bg-orange-650 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                    >
                      {isLocating ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin text-white mr-1"
                          />
                          <span>Acquiring GPS...</span>
                        </>
                      ) : (
                        <>
                          <LocateFixed size={16} className="mr-1" />
                          <span>Grant Location Access</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isLocating}
                      onClick={() => {
                        setAutoMatchedWard(null);
                        setUnmatchedLocality(null);
                        setStep("ward");
                      }}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-xl font-bold transition text-xs flex items-center justify-center cursor-pointer disabled:opacity-50"
                    >
                      <span>Choose Manually Instead</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 5: WARD & STREET SELECTION */}
            {step === "ward" && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5"
              >
                <div className="text-center pb-2">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                    Find Your Street
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed font-medium">
                    Search for your street, road, or layout name. We will map
                    your municipal ward automatically.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmitWard(handleWardSelectSubmit)}
                  className="space-y-4"
                >
                  {!showManualFallback ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Street Name / Landmark *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                          </span>
                          <input
                            type="text"
                            value={streetQuery}
                            onChange={handleStreetSearchChange}
                            placeholder="Type street name (e.g. MTH Road, Gandhi Nagar)..."
                            className="w-full h-12.5 pl-10 pr-10 rounded-[14px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-bold text-xs focus:ring-2 focus:ring-primary/50 focus:outline-none transition shadow-sm"
                          />
                          {streetQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setStreetQuery("");
                                setStreetResults([]);
                                setSelectedStreetItem(null);
                                setValueWard("wardNumber", 0, {
                                  shouldValidate: true,
                                });
                                setValueWard("streetName", "", {
                                  shouldValidate: true,
                                });
                              }}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        {errorsWard.streetName && (
                          <p className="text-[11px] text-rose-500 font-medium">
                            {errorsWard.streetName.message}
                          </p>
                        )}
                      </div>

                      {streetResults.length > 0 && !selectedStreetItem && (
                        <ul className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 shadow-xl max-h-64 overflow-y-auto animate-in fade-in duration-150 text-left">
                          {streetResults.map((item) => (
                            <li
                              key={item.id}
                              onClick={() => handleSelectStreetItem(item)}
                              className="p-3.5 hover:bg-amber-50/70 dark:hover:bg-slate-800/80 cursor-pointer flex items-start gap-3 transition group"
                            >
                              <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition shadow-2xs">
                                <MapPin size={16} />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal wrap-break-word pr-1 capitalize">
                                  {item.streetName.toLocaleLowerCase("en-IN")}
                                </p>

                                <div className="flex items-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary dark:group-hover:bg-primary/20 dark:group-hover:text-orange-300 text-[10px] font-bold transition">
                                    <Building2 size={12} className="shrink-0" />
                                    <span>Ward {item.wardNo}</span>
                                  </span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {streetQuery.trim() &&
                        streetResults.length === 0 &&
                        !selectedStreetItem && (
                          <div className="p-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              No street found matching &quot;{streetQuery}&quot;
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setShowManualFallback(true);
                                setValueWard("streetName", streetQuery, {
                                  shouldValidate: true,
                                });
                              }}
                              className="text-[11px] text-primary hover:underline font-bold mt-1 inline-block"
                            >
                              Pick your ward number manually instead →
                            </button>
                          </div>
                        )}

                      {selectedStreetItem && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start justify-between gap-3 animate-in zoom-in-95 duration-200 text-left">
                          <div className="flex items-start space-x-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                              <CheckCircle2 size={18} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
                                  Your Street is in
                                </span>
                                <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md">
                                  Ward {selectedStreetItem.wardNo}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-white leading-normal wrap-break-word capitalize">
                                {selectedStreetItem.streetName}
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
                                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold underline px-2 py-1 shrink-0 mt-0.5"
                                >
                                  Change
                                </button>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {!selectedStreetItem && (
                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => setShowManualFallback(true)}
                            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium underline transition"
                          >
                            Can&apos;t find your street? Select ward manually
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
                        <span>Manual Ward Selection Mode</span>
                        <button
                          type="button"
                          onClick={() => setShowManualFallback(false)}
                          className="text-primary font-bold hover:underline ml-2"
                        >
                          ← Back to Search
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Select Ward Number *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
                            <MapPin size={18} />
                          </span>
                          <select
                            {...registerWard("wardNumber", {
                              valueAsNumber: true,
                            })}
                            className="w-full h-12.5 pl-10 pr-8 rounded-[14px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-primary/50 focus:outline-none cursor-pointer appearance-none"
                          >
                            <option value={0} disabled>
                              Select your Ward (0 to 48)
                            </option>
                            {wards.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                            ▼
                          </div>
                        </div>
                        {errorsWard.wardNumber && (
                          <p className="text-[11px] text-rose-500 font-medium">
                            {errorsWard.wardNumber.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Street Name / Landmark *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Kamaraj Nagar Main Road"
                          {...registerWard("streetName")}
                          className="w-full h-12.5 px-4 rounded-[14px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-bold text-xs focus:ring-2 focus:ring-primary/50 focus:outline-none transition"
                        />
                        {errorsWard.streetName && (
                          <p className="text-[11px] text-rose-500 font-medium">
                            {errorsWard.streetName.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("location")}
                      className="h-12.5 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-[14px] font-bold transition text-xs flex items-center justify-center cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                    </button>

                    <button
                      type="submit"
                      disabled={!isValidWard}
                      className="flex-1 h-12.5 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-[14px] font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                    >
                      <span>Complete Setup</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 6: NOTIFICATION PERMISSION & SAVE DATABASE */}
            {step === "notification" && (
              <motion.div
                key="notification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto relative">
                    <Bell className="w-8 h-8 animate-bounce" />
                    <span className="absolute top-4 right-4 w-3.5 h-3.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    Stay Informed Instantly
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Avadi City sends timely notices for critical alerts,
                    emergency SOS, and local events happening in Ward{" "}
                    {formData.wardNumber || "your area"}.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-left space-y-3.5 shadow-sm max-w-sm mx-auto">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-rose-600 dark:text-rose-400">
                          Emergency Alert
                        </h4>
                        <span className="text-[9px] text-slate-450 dark:text-slate-500">
                          Just now
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        Heavy Rain Warning: Ward {formData.wardNumber}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-405 leading-relaxed mt-0.5">
                        Avoid waterlogged underpasses near Avadi Station.
                        Emergency assistance team active.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCompleteOnboarding(true)}
                    className="w-full py-3.5 bg-primary hover:bg-orange-650 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving Citizen Profile...</span>
                      </>
                    ) : (
                      <>
                        <BellRing size={14} className="mr-1.5" />
                        <span>Enable Notifications & Save</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCompleteOnboarding(false)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-xl font-bold transition text-xs flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Skip for Now"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Municipal Credit Footer */}
      <div className="mt-8 text-center text-[9px] tracking-wider uppercase font-semibold text-slate-400 dark:text-slate-500 flex flex-col items-center space-y-1">
        <span>© {new Date().getFullYear()} Avadi City</span>
        <span className="opacity-70 text-[8px] font-normal normal-case">
          Citizen Services & Grievance Portal
        </span>
      </div>
    </div>
  );
}
