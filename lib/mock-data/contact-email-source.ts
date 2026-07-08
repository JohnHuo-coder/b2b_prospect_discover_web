export type ContactSourceNotFoundReason = {
  reason: string;
  count: number;
};

export type ContactWebsiteFailureDetail = {
  stage: string;
  reason: string;
  count: number;
};

export type ContactEmailSourceMockStats = {
  apollo: {
    rate: number;
    found: number;
    total: number;
    notFoundReasons: ContactSourceNotFoundReason[];
  };
  anymailFinder: {
    rate: number;
    found: number;
    total: number;
    notFoundReasons: ContactSourceNotFoundReason[];
  };
  emailFromWebsite: {
    rate: number;
    found: number;
    total: number;
    failures: ContactWebsiteFailureDetail[];
  };
};

export const mockContactEmailSourceStats: ContactEmailSourceMockStats = {
  apollo: {
    rate: 42,
    found: 10,
    total: 24,
    notFoundReasons: [
      { reason: "No matching contact found in Apollo database", count: 8 },
      { reason: "Company domain not available for lookup", count: 3 },
      { reason: "Apollo returned contacts without email addresses", count: 2 },
      { reason: "Apollo API request failed", count: 1 },
    ],
  },
  anymailFinder: {
    rate: 29,
    found: 7,
    total: 24,
    notFoundReasons: [
      { reason: "No email found for the target domain", count: 9 },
      { reason: "Anymail Finder confidence below threshold", count: 4 },
      { reason: "Invalid or unsupported company domain", count: 3 },
      { reason: "Anymail Finder API timeout", count: 1 },
    ],
  },
  emailFromWebsite: {
    rate: 21,
    found: 5,
    total: 24,
    failures: [
      {
        stage: "email_scraping",
        reason: "No email pattern detected on selected contact page",
        count: 11,
      },
      {
        stage: "email_scraping",
        reason: "Contact page could not be reached",
        count: 4,
      },
      {
        stage: "email_classification",
        reason: "Scraped email failed confidence classification",
        count: 3,
      },
      {
        stage: "email_classification",
        reason: "Multiple candidates found but none passed review",
        count: 1,
      },
    ],
  },
};
