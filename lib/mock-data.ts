export type LeadStatus = "sent" | "heard_back" | "pending" | "rejected";

export type Lead = {
  id: string;
  company: string;
  contact: string;
  website: string;
  status: LeadStatus;
  added: string;
};

export const dashboardSummary = {
  sent: 2,
  heard_back: 3,
  pending: 3,
  rejected: 2,
};

export const leads: Lead[] = [
  {
    id: "L001",
    company: "Apex Digital Solutions",
    contact: "Sarah Mitchell",
    website: "apexdigital.io",
    status: "heard_back",
    added: "May 31, 2026",
  },
  {
    id: "L002",
    company: "Northwind Analytics",
    contact: "James Chen",
    website: "northwindanalytics.com",
    status: "rejected",
    added: "May 30, 2026",
  },
  {
    id: "L003",
    company: "BrightPath Consulting",
    contact: "Emily Rodriguez",
    website: "brightpath.co",
    status: "sent",
    added: "May 29, 2026",
  },
  {
    id: "L004",
    company: "Summit Growth Partners",
    contact: "Michael Torres",
    website: "summitgrowth.com",
    status: "pending",
    added: "May 28, 2026",
  },
  {
    id: "L005",
    company: "Horizon Tech Labs",
    contact: "Lisa Park",
    website: "horizontech.io",
    status: "heard_back",
    added: "May 27, 2026",
  },
  {
    id: "L006",
    company: "Vertex Marketing Group",
    contact: "David Kim",
    website: "vertexmarketing.com",
    status: "sent",
    added: "May 26, 2026",
  },
  {
    id: "L007",
    company: "Cascade Software Inc",
    contact: "Anna Williams",
    website: "cascadesoftware.io",
    status: "pending",
    added: "May 25, 2026",
  },
  {
    id: "L008",
    company: "Pinnacle Ventures",
    contact: "Robert Johnson",
    website: "pinnacleventures.co",
    status: "rejected",
    added: "May 24, 2026",
  },
  {
    id: "L009",
    company: "NovaBridge Systems",
    contact: "Jennifer Lee",
    website: "novabridge.io",
    status: "heard_back",
    added: "May 23, 2026",
  },
  {
    id: "L010",
    company: "Sterling Data Corp",
    contact: "Chris Anderson",
    website: "sterlingdata.com",
    status: "pending",
    added: "May 22, 2026",
  },
];

export const businessConfig = {
  business_name: "Suvarnaveda Wellness",
  sender_name: "Parvina Kuludomphongse",
  sender_email: "parvina@suvarnaveda.com",
  collaboration_intent:
    "We run Suvarnaveda, a wellness/medspa program in Bangkok. Our guests receive treatments at our wellness center and need a quiet, restful hotel nearby to stay during treatment days. We are reaching out to explore whether your property would be interested in a B2B accommodation partnership — combined wellness packages where your hotel is the guest stay partner.",
  requirements: [
    "The hotel must be located within 10 km of Suvarnaveda Wellness in Bangkok.",
    "The property should have a calm, restful, and boutique atmosphere — not a large convention or nightlife venue.",
    "The hotel should serve health-conscious or wellness-oriented guests.",
    "The property must be able to offer room packages in coordination with external wellness providers.",
  ],
  latitude: "13.737",
  longitude: "100.557",
  max_distance: "10 km",
  fit_score_cutoff: 75,
  low_conf_cutoff_email_classification: 30,
  qualified_conf_email_classification: 70,
  search_keyword: "luxury hotel",
  search_location: "Bangkok Thailand",
  contact_titles: [
    "Director of Sales",
    "Sales Manager",
    "General Manager",
    "Director of Marketing",
    "Marketing Manager",
  ],
  contact_categories: ["Sales", "Marketing"],
  min_words: 90,
  max_words: 160,
  number_of_candidates_per_run: 20,
  test_mode: true,
  test_email_override: "c.weaver1on1@gmail.com",
  follow_up_delay: "7 days",
  excluded_partners: ["Rembrandt Hotel Bangkok", "Rembrandt Residences Bangkok"],
};

export const statusLabels: Record<LeadStatus | "all", string> = {
  all: "All statuses",
  sent: "Sent",
  heard_back: "Heard Back",
  pending: "Pending",
  rejected: "Rejected",
};
