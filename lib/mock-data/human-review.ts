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
