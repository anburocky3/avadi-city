import type { Metadata } from "next";
import TransportContainer from "@/features/transport/components/TransportContainer";

export const metadata: Metadata = {
  title: "Transport in Avadi",
  description:
    "Find public transport routes, schedules, and travel information for Avadi.",
};

export const TransportPage: React.FC = () => {
  return <TransportContainer />;
};

export default TransportPage;
