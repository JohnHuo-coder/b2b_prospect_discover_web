export type HumanReviewQueueItem = {
  id: string;
  company: string;
  website: string | null;
  reason: string;
  email?: string;
};

export const mockComplianceCheckQueue: HumanReviewQueueItem[] = [
  {
    id: "545",
    company: "Canalis Suvarnabhumi Airport Hotel",
    website: "canalissuvarnabhumi.com",
    reason: "compliance check not passed",
  },
  {
    id: "512",
    company: "Samala Suites Bangkok Sukhumvit 19",
    website: "samalasuites.com",
    reason: "unverified claim in outreach copy",
  },
  {
    id: "498",
    company: "HOLY SHEET Hostel",
    website: "holysheet.hostel",
    reason: "missing opt-out language",
  },
];

export const mockEmailClassificationQueue: HumanReviewQueueItem[] = [
  {
    id: "621",
    company: "The Quarter Saladaeng",
    website: "thequarterhotels.com",
    email: "reservations@thequarterhotels.com",
    reason: "confidence score below qualified threshold",
  },
  {
    id: "604",
    company: "Mövenpick BDMS Wellness Resort",
    website: "movenpick.com",
    email: "info@movenpick.com",
    reason: "role classification uncertain",
  },
  {
    id: "588",
    company: "Eastin Thana City Golf Resort",
    website: "eastin.com",
    email: "sales@eastin.com",
    reason: "generic inbox detected",
  },
];
