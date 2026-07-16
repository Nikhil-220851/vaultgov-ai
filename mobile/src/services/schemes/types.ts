export interface SchemeRecord {
  schemeId: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  eligibility: string;
  documentsRequired: string[];
  incomeLimit: string; // "EWS" | "LIG" | "MIG" | "HIG" | "All"
  gender: string;      // "Male" | "Female" | "Other" | "All"
  ageRange: string;    // e.g. "18-40", "0-10", "18-70", "All"
  occupation: string;  // "Student" | "Farmer" | "Unorganized Worker" | "Any" | "Entrepreneur"
  education: string;   // "Secondary" | "Graduate" | "Any"
  state: string;       // e.g. "All" or "Madhya Pradesh"
  district?: string;
  category: string;
  subcategory: string;
  applicationMode: 'Online' | 'Offline' | 'Both';
  applicationStart: string; // YYYY-MM-DD
  applicationEnd: string;   // YYYY-MM-DD or "Permanent"
  status: 'Active' | 'Upcoming' | 'Closing Soon' | 'Permanent' | 'Archived' | 'Disabled';
  officialWebsite: string;
  officialApplyLink: string;
  officialNotificationPDF: string;
  ministry: string;
  launchYear: number;
  lastVerifiedDate: string; // YYYY-MM-DD
  priorityScore: number;    // e.g. 0-10 base score
  requiredDocuments: string[];
  recommendedDocuments: string[];
  renewable: boolean;
  tags: string[];

  // Source Metadata
  sourceName?: string;
  sourceURL?: string;
  verifiedBy?: string;
  verificationDate?: string;

  // Sync details
  version: number;
  contentHash: string;
  lastUpdated: string;
  officialNotification: string;

  // Eligibility helpers & compliance fields
  name: string;
  shortDescription: string;
  fullDescription: string;
  targetAudience: string;
  minAge: number;
  maxAge?: number;
  studentEligible: boolean;
  farmerEligible: boolean;
  seniorCitizenEligible: boolean;
  disabledEligible: boolean;
}


export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type SyncType = 'auto' | 'manual';
