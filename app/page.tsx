import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Prospect Discover — B2B Partnership Lead Generation",
  description:
    "Automated B2B prospect discovery, fit scoring, contact enrichment, Gmail outreach, and lead pipeline management.",
};

export default function Home() {
  return <LandingPage />;
}
