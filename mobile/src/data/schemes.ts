import { VaultGovUser, VaultGovDocument } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchemeCategory =
  | 'Student'
  | 'Farmer'
  | 'Women'
  | 'Senior Citizens'
  | 'Health'
  | 'Insurance'
  | 'Employment'
  | 'Skill Development'
  | 'Business'
  | 'Startup'
  | 'Housing'
  | 'Agriculture'
  | 'Pension'
  | 'Financial Inclusion'
  | 'Education'
  | 'Social Welfare'
  | 'Disabled'
  | 'Youth'
  | 'Government'
  | 'CSR'
  | 'Scholarship'
  | 'MSME'
  | 'Research';

export type SchemeType = 'Central' | 'State';
export type EligibilityStatus = 'highly_recommended' | 'eligible' | 'partially_eligible' | 'not_eligible';
export type DocumentStatus = 'uploaded' | 'missing' | 'expired' | 'verified' | 'optional';
export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'documents_requested'
  | 'approved'
  | 'rejected';

export interface EligibilityCriterion {
  id: string;
  label: string;
  required: string;
  userValue: string;
  passed: boolean;
  reason?: string;
}

export interface RequiredDocument {
  id: string;
  name: string;
  iconName: string; // MaterialCommunityIcons name
  status: DocumentStatus;
  description?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Scheme {
  id: string;
  title: string;
  shortTitle: string;
  department: string;
  ministry: string;
  category: SchemeCategory;
  type: SchemeType;
  state?: string;
  description: string;
  benefits: string[];
  financialAssistance: string;
  applicationPeriod: string;
  renewable: boolean;
  renewalPeriod?: string;
  deadline: string;
  processingTime: string;
  applicationFee: number;
  officialPortal: string;
  eligibilityPercentage: number;
  eligibilityStatus: EligibilityStatus;
  eligibilityCriteria: EligibilityCriterion[];
  requiredDocuments: RequiredDocument[];
  recommendedDocuments: RequiredDocument[];
  faqs: FAQ[];

  accentColor: string;
  iconName: string;
  tags: string[];

  // Database fields for compliance
  name: string;
  shortDescription: string;
  fullDescription: string;
  subcategory: string;
  targetAudience: string;
  minAge: number;
  maxAge?: number;
  gender: string;
  incomeLimit: string;
  occupation: string;
  studentEligible: boolean;
  farmerEligible: boolean;
  seniorCitizenEligible: boolean;
  disabledEligible: boolean;
  documentsRequired: string[];
  officialWebsite: string;
  officialApplyLink: string;
  launchYear: number;
  applicationMode: string;
  status: string;

  // Sync details
  version: number;
  contentHash?: string;
  lastUpdated: string;
  officialNotification: string;

  // Source Metadata
  sourceName?: string;
  sourceURL?: string;
  verifiedBy?: string;
  verificationDate?: string;
}


export interface AppliedScheme {
  schemeId: string;
  applicationId: string;
  applicationDate: string;
  status: ApplicationStatus;
  submittedAt: string;
}

// ─── 10 Real Government Schemes Seeding Data ───────────────────────────────────

export const BASE_SCHEMES_DATA = [
  {
    schemeId: 'scheme-001',
    title: 'Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    subtitle: 'Universal Health Cover',
    description: "Ayushman Bharat PM-JAY is the world's largest health assurance scheme, providing coverage of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization. Cashless treatment is available at any empanelled public or private hospital across India.",
    benefits: [
      'Health cover of ₹5 lakh per family per year',
      'Cashless treatment at any empanelled public or private hospital',
      'All pre-existing conditions covered from day one of enrollment',
      'Covers room charges, doctor fee, OT fee, ICU charges, medicines, etc.'
    ],
    eligibility: 'All families identified in Socio-Economic Caste Census (SECC) 2011 or registered with state health insurance cards.',
    documentsRequired: ['Aadhaar Card', 'Ration Card', 'Income Certificate'],
    incomeLimit: 'EWS',
    gender: 'All',
    ageRange: 'All',
    occupation: 'Any',
    education: 'Any',
    state: 'All',
    applicationMode: 'Online' as const,
    applicationStart: '2018-09-23',
    applicationEnd: 'Permanent',
    status: 'Active' as const,
    officialWebsite: 'https://pmjay.gov.in',
    officialApplyLink: 'https://beneficiary.nha.gov.in',
    officialNotificationPDF: 'https://pmjay.gov.in/sites/default/files/2018-09/NHA_Guidelines.pdf',
    ministry: 'Ministry of Health & Family Welfare',
    launchYear: 2018,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 10,
    requiredDocuments: ['Aadhaar Card', 'Ration Card'],
    recommendedDocuments: ['Income Certificate'],
    renewable: true,
    tags: ['Health', 'Insurance', 'Medical', 'Central', 'Cashless'],
    category: 'Health',
    subcategory: 'Health Insurance',
    name: 'Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    shortDescription: 'Universal Health Cover of up to ₹5 lakh per family per year.',
    fullDescription: "Ayushman Bharat PM-JAY is the world's largest health assurance scheme, providing coverage of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.",
    targetAudience: 'Economically weaker sections and low-income families',
    minAge: 0,
    maxAge: undefined,
    studentEligible: true,
    farmerEligible: true,
    seniorCitizenEligible: true,
    disabledEligible: true
  },
  {
    schemeId: 'scheme-002',
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    subtitle: 'Income Support for Farmers',
    description: 'A Central Sector Scheme providing income support to all landholding farmer families across the country to enable them to take care of expenses related to agriculture and domestic needs.',
    benefits: [
      'Financial benefit of ₹6,000 per year',
      'Disbursed in three equal installments of ₹2,000 every four months',
      'Direct Benefit Transfer directly into the bank accounts of farmers'
    ],
    eligibility: 'All landholding farmer families holding cultivable agricultural land in their name.',
    documentsRequired: ['Aadhaar Card', 'Land Ownership Documents', 'Bank Passbook'],
    incomeLimit: 'All',
    gender: 'All',
    ageRange: '18-120',
    occupation: 'Farmer',
    education: 'Any',
    state: 'All',
    applicationMode: 'Online' as const,
    applicationStart: '2018-12-01',
    applicationEnd: 'Permanent',
    status: 'Active' as const,
    officialWebsite: 'https://pmkisan.gov.in',
    officialApplyLink: 'https://pmkisan.gov.in/RegistrationFormNew.aspx',
    officialNotificationPDF: 'https://pmkisan.gov.in/Documents/Guidelines.pdf',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    launchYear: 2019,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 9,
    requiredDocuments: ['Aadhaar Card', 'Land Ownership Documents', 'Bank Passbook'],
    recommendedDocuments: [],
    renewable: true,
    tags: ['Agriculture', 'Farmers', 'Income Support', 'Central'],
    category: 'Agriculture',
    subcategory: 'Income Support',
    name: 'Pradhan Mantri Kisan Samman Nidhi',
    shortDescription: 'Income support of ₹6,000 per year for landholding farmer families.',
    fullDescription: 'A Central Sector Scheme providing income support to all landholding farmer families across the country.',
    targetAudience: 'Landholding farmers',
    minAge: 18,
    maxAge: undefined,
    studentEligible: false,
    farmerEligible: true,
    seniorCitizenEligible: true,
  },
  {
    schemeId: 'scheme-003',
    title: 'Pradhan Mantri Awas Yojana — Urban (PMAY-U)',
    subtitle: 'Affordable Housing Mission',
    description: 'A flagship mission of the Government of India implemented by the Ministry of Housing and Urban Affairs (MoHUA) which addresses urban housing shortage among the EWS/LIG and MIG categories.',
    benefits: [
      'Interest subsidy of up to 6.5% on housing loans',
      'Subsidy amount of up to ₹2.67 lakh directly credited to loan account',
      'Preference given to female ownership or co-ownership of the property'
    ],
    eligibility: 'Families with annual income up to ₹18 lakh who do not own a pucca house anywhere in India.',
    documentsRequired: ['Aadhaar Card', 'PAN Card', 'Income Certificate', 'Affidavit of No Pucca House'],
    incomeLimit: 'MIG',
    gender: 'All',
    ageRange: '18-120',
    occupation: 'Any',
    education: 'Any',
    state: 'All',
    applicationMode: 'Online' as const,
    applicationStart: '2015-06-25',
    applicationEnd: '2026-12-31',
    status: 'Active' as const,
    officialWebsite: 'https://pmaymis.gov.in',
    officialApplyLink: 'https://pmaymis.gov.in/Open/Application_Form.aspx',
    officialNotificationPDF: 'https://pmaymis.gov.in/PDF/Guidelines.pdf',
    ministry: 'Ministry of Housing & Urban Affairs',
    launchYear: 2015,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 8,
    requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Income Certificate'],
    recommendedDocuments: ['Affidavit of No Pucca House'],
    renewable: false,
    tags: ['Housing', 'Urban', 'Subsidy', 'Central'],
    category: 'Housing',
    subcategory: 'Affordable Housing',
    name: 'Pradhan Mantri Awas Yojana — Urban',
    shortDescription: 'Financial assistance and interest subsidies for urban home buyers.',
    fullDescription: 'A flagship mission of the Government of India which addresses urban housing shortage.',
    targetAudience: 'Urban households without pucca houses',
    minAge: 18,
    maxAge: undefined,
    studentEligible: false,
    farmerEligible: true,
    seniorCitizenEligible: true,
    disabledEligible: true
  },
  {
    schemeId: 'scheme-004',
    title: 'Sukanya Samriddhi Yojana (SSY)',
    subtitle: 'Girl Child Savings',
    description: 'A small deposit scheme for the girl child launched as part of the "Beti Bachao Beti Padhao" campaign, offering high interest rates and tax exemptions.',
    benefits: [
      'High interest rate on savings (currently 8.2% per annum)',
      'Triple tax benefits: Section 80C deduction, tax-free interest, tax-free maturity',
      'Account matures on completion of 21 years or upon girl child\'s marriage after age 18'
    ],
    eligibility: 'Parents or legal guardians of a girl child aged below 10 years. Maximum two accounts per household.',
    documentsRequired: ['Birth Certificate of girl child', 'Aadhaar Card of Parent', 'PAN Card of Parent'],
    incomeLimit: 'All',
    gender: 'Female',
    ageRange: '0-10',
    occupation: 'Any',
    education: 'Any',
    state: 'All',
    applicationMode: 'Offline' as const,
    applicationStart: '2015-01-22',
    applicationEnd: 'Permanent',
    status: 'Active' as const,
    officialWebsite: 'https://www.nsiindia.gov.in',
    officialApplyLink: 'https://www.indiapost.gov.in',
    officialNotificationPDF: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=223',
    ministry: 'Ministry of Finance',
    launchYear: 2015,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 9,
    requiredDocuments: ['Birth Certificate of girl child', 'Aadhaar Card of Parent'],
    recommendedDocuments: ['PAN Card of Parent'],
    renewable: false,
    tags: ['Women', 'Girl Child', 'Savings', 'Central'],
    category: 'Women',
    subcategory: 'Savings Scheme',
    name: 'Sukanya Samriddhi Yojana',
    shortDescription: 'High-interest savings account for girl children under 10 years.',
    fullDescription: 'A small deposit scheme for the girl child offering high interest rates and tax exemptions.',
    targetAudience: 'Parents of girl children under 10',
    minAge: 0,
    maxAge: 10,
    studentEligible: true,
    farmerEligible: true,
    seniorCitizenEligible: false,
    disabledEligible: true
  },
  {
    schemeId: 'scheme-005',
    title: 'Atal Pension Yojana (APY)',
    subtitle: 'Social Security Pension',
    description: 'A pension scheme focused on the unorganized sector workers, providing a guaranteed minimum pension of ₹1,000 to ₹5,000 per month after the age of 60 years.',
    benefits: [
      'Guaranteed minimum pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000 or ₹5,000 per month from age 60',
      'In case of death, the same pension is guaranteed to the spouse for life',
      'On death of both subscriber and spouse, the entire pension corpus is returned to the nominee'
    ],
    eligibility: 'All citizens of India between 18 and 40 years who hold a bank account and are not members of any statutory social security schemes or income taxpayers.',
    documentsRequired: ['Aadhaar Card', 'Bank Passbook'],
    incomeLimit: 'All',
    gender: 'All',
    ageRange: '18-40',
    occupation: 'Unorganized Worker',
    education: 'Any',
    state: 'All',
    applicationMode: 'Both' as const,
    applicationStart: '2015-06-01',
    applicationEnd: 'Permanent',
    status: 'Active' as const,
    officialWebsite: 'https://www.npscra.nsdl.co.in',
    officialApplyLink: 'https://www.npscra.nsdl.co.in/scheme-details.php',
    officialNotificationPDF: 'https://www.npscra.nsdl.co.in/download/Atal-Pension-Yojana-Rules.pdf',
    ministry: 'Ministry of Finance',
    launchYear: 2015,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 8,
    requiredDocuments: ['Aadhaar Card', 'Bank Passbook'],
    recommendedDocuments: [],
    renewable: true,
    tags: ['Pension', 'Retirement', 'Social Security', 'Central'],
    category: 'Pension',
    subcategory: 'Social Security',
    name: 'Atal Pension Yojana',
    shortDescription: 'Guaranteed pension of ₹1,000 to ₹5,000/month after age 60.',
    fullDescription: 'A pension scheme focused on the unorganized sector workers.',
    targetAudience: 'Unorganized sector workers aged 18 to 40',
    minAge: 18,
    maxAge: 40,
    studentEligible: false,
    farmerEligible: true,
    seniorCitizenEligible: false,
    disabledEligible: true
  },
  {
    schemeId: 'scheme-006',
    title: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    subtitle: 'Low-Cost Accident Insurance',
    description: 'An accident insurance scheme offering high coverage at a nominal premium, accessible to all bank account holders.',
    benefits: [
      'Accidental death cover of ₹2 lakh for a premium of just ₹20 per year',
      'Total and irrecoverable loss of both eyes or loss of use of both hands or feet cover of ₹2 lakh',
      'Loss of one eye or loss of use of one hand or foot cover of ₹1 lakh'
    ],
    eligibility: 'All bank account holders between 18 and 70 years of age.',
    documentsRequired: ['Aadhaar Card', 'Bank Passbook'],
    incomeLimit: 'All',
    gender: 'All',
    ageRange: '18-70',
    occupation: 'Any',
    education: 'Any',
    state: 'All',
    applicationMode: 'Online' as const,
    applicationStart: '2015-05-09',
    applicationEnd: 'Permanent',
    status: 'Active' as const,
    officialWebsite: 'https://www.jansuraksha.gov.in',
    officialApplyLink: 'https://www.jansuraksha.gov.in/Forms-PMSBY.aspx',
    officialNotificationPDF: 'https://www.jansuraksha.gov.in/PMSBY-Rules.pdf',
    ministry: 'Ministry of Finance',
    launchYear: 2015,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 7,
    requiredDocuments: ['Aadhaar Card', 'Bank Passbook'],
    recommendedDocuments: [],
    renewable: true,
    tags: ['Insurance', 'Accident Cover', 'Financial Security', 'Central'],
    category: 'Insurance',
    subcategory: 'Accident Insurance',
    name: 'Pradhan Mantri Suraksha Bima Yojana',
    shortDescription: 'Low-cost accident insurance cover of ₹2 lakh for ₹20/year.',
    fullDescription: 'An accident insurance scheme offering high coverage at a nominal premium.',
    targetAudience: 'Bank account holders aged 18 to 70',
    minAge: 18,
    maxAge: 70,
    studentEligible: true,
    farmerEligible: true,
    seniorCitizenEligible: true,
    disabledEligible: true
  },
  {
    schemeId: 'scheme-007',
    title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
    subtitle: 'Skill Training & Certification',
    description: 'The flagship outcome-based skill training scheme of MSDE aiming to enable a large number of Indian youth to take up industry-relevant skill training.',
    benefits: [
      'Free industry-relevant skill training in over 300 job roles',
      'Stipend of up to ₹8,000 upon successful completion and certification',
      'NSQF-aligned government certification and job placement assistance'
    ],
    eligibility: 'Unemployed youth, school or college dropouts with a valid Aadhaar and bank account.',
    documentsRequired: ['Aadhaar Card', 'Education Certificate', 'Bank Passbook'],
    incomeLimit: 'All',
    gender: 'All',
    ageRange: '15-45',
    occupation: 'Student',
    education: 'Any',
    state: 'All',
    applicationMode: 'Online' as const,
    applicationStart: '2015-07-16',
    applicationEnd: '2027-03-31',
    status: 'Active' as const,
    officialWebsite: 'https://www.pmkvyofficial.org',
    officialApplyLink: 'https://www.skillindia.gov.in',
    officialNotificationPDF: 'https://www.pmkvyofficial.org/App_Documents/Guidelines/PMKVY-Guidelines.pdf',
    ministry: 'Ministry of Skill Development & Entrepreneurship',
    launchYear: 2015,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 8,
    requiredDocuments: ['Aadhaar Card', 'Education Certificate'],
    recommendedDocuments: ['Bank Passbook'],
    renewable: false,
    tags: ['Skill Development', 'Training', 'Youth', 'Employment', 'Central'],
    category: 'Skill Development',
    subcategory: 'Employment & Training',
    name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
    shortDescription: 'Free skill training and NSQF certification for Indian youth.',
    fullDescription: 'The flagship outcome-based skill training scheme of MSDE.',
    targetAudience: 'Unemployed youth and school dropouts',
    minAge: 15,
    maxAge: 45,
    studentEligible: true,
    farmerEligible: true,
    seniorCitizenEligible: false,
    disabledEligible: true
  },
  {
    schemeId: 'scheme-008',
    title: 'Digital India Internship Scheme (DIIS)',
    subtitle: 'Government IT Internship',
    description: 'An opportunity for students pursuing computer/IT/engineering degrees to intern with MeitY and work on national e-governance policies and systems.',
    benefits: [
      'Monthly stipend of ₹10,000 for 2 months',
      'Valuable certificate from Ministry of Electronics & Information Technology (MeitY) upon completion',
      'Direct exposure to policy making and digital transformation projects'
    ],
    eligibility: 'Indian students pursuing BE/B.Tech/MCA/M.Sc (IT) with minimum 60% marks in qualifying exams.',
    documentsRequired: ['Aadhaar Card', 'Education Certificate', 'College ID / NOC'],
    incomeLimit: 'All',
    gender: 'All',
    ageRange: '18-28',
    occupation: 'Student',
    education: 'Graduate',
    state: 'All',
    applicationMode: 'Online' as const,
    applicationStart: '2018-05-15',
    applicationEnd: '2026-09-30',
    status: 'Active' as const,
    officialWebsite: 'https://internship.meity.gov.in',
    officialApplyLink: 'https://internship.meity.gov.in',
    officialNotificationPDF: 'https://internship.meity.gov.in/Guidelines.pdf',
    ministry: 'Ministry of Electronics & Information Technology',
    launchYear: 2018,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 7,
    requiredDocuments: ['Aadhaar Card', 'Education Certificate'],
    recommendedDocuments: ['College ID / NOC'],
    renewable: false,
    tags: ['Internship', 'Technology', 'Youth', 'Stipend', 'Central'],
    category: 'Youth',
    subcategory: 'Internship',
    name: 'Digital India Internship Scheme',
    shortDescription: '2-month paid government IT internship with ₹10,000/month stipend.',
    fullDescription: 'An opportunity for students pursuing IT/engineering degrees.',
    targetAudience: 'College students pursuing IT/engineering degrees',
    minAge: 18,
    maxAge: 28,
    studentEligible: true,
    farmerEligible: false,
    seniorCitizenEligible: false,
    disabledEligible: true
  },
  {
    schemeId: 'scheme-009',
    title: 'National Scholarship Portal — Post Matric Scholarships Scheme',
    subtitle: 'Post Matric Scholarship',
    description: 'A scheme to provide financial assistance to students belonging to economically weaker sections to pursue post-matric or post-secondary courses.',
    benefits: [
      'Scholarship amount between ₹10,000 and ₹50,000 per annum depending on course',
      'Direct Benefit Transfer to student bank accounts',
      'Covers academic fees, books, study tours, and maintenance allowance'
    ],
    eligibility: 'Indian students pursuing higher education whose annual family income is below ₹2.5 lakh.',
    documentsRequired: ['Aadhaar Card', 'Income Certificate', 'Education Certificate', 'Bank Passbook'],
    incomeLimit: 'EWS',
    gender: 'All',
    ageRange: '16-30',
    occupation: 'Student',
    education: 'Secondary',
    state: 'All',
    applicationMode: 'Online' as const,
    applicationStart: '2015-07-01',
    applicationEnd: '2026-10-31',
    status: 'Active' as const,
    officialWebsite: 'https://scholarships.gov.in',
    officialApplyLink: 'https://scholarships.gov.in',
    officialNotificationPDF: 'https://scholarships.gov.in/Guidelines.pdf',
    ministry: 'Ministry of Social Justice & Empowerment',
    launchYear: 2015,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 8,
    requiredDocuments: ['Aadhaar Card', 'Income Certificate', 'Education Certificate'],
    recommendedDocuments: ['Bank Passbook'],
    renewable: true,
    tags: ['Scholarship', 'Education', 'Student Support', 'Central'],
    category: 'Student',
    subcategory: 'Scholarship',
    name: 'National Scholarship Portal — Post Matric Scholarships Scheme',
    shortDescription: 'Financial scholarship of up to ₹50,000/year for higher education.',
    fullDescription: 'A scheme to provide financial assistance to students belonging to EWS.',
    targetAudience: 'Low-income students pursuing higher education',
    minAge: 16,
    maxAge: 30,
    studentEligible: true,
    farmerEligible: false,
    seniorCitizenEligible: false,
    disabledEligible: true
  },
  {
    schemeId: 'scheme-010',
    title: 'Startup India Scheme',
    subtitle: 'Startup India Support',
    description: 'A flagship initiative of the Government of India intended to build a strong ecosystem that is conducive for the growth of startup businesses.',
    benefits: [
      'Income tax exemptions for 3 consecutive years under Section 80-IAC',
      'Up to 80% rebate on patent filing fees and fast-tracked patent inspection',
      'Access to ₹10,000 Crore Fund of Funds and credit guarantee schemes'
    ],
    eligibility: 'DPIIT recognized entity incorporated as Private Limited, LLP or Partnership firm not older than 10 years.',
    documentsRequired: ['Aadhaar Card', 'PAN Card', 'Incorporation Certificate'],
    incomeLimit: 'All',
    gender: 'All',
    ageRange: '18-120',
    occupation: 'Entrepreneur',
    education: 'Any',
    state: 'All',
    applicationMode: 'Online' as const,
    applicationStart: '2016-01-16',
    applicationEnd: 'Permanent',
    status: 'Active' as const,
    officialWebsite: 'https://www.startupindia.gov.in',
    officialApplyLink: 'https://www.startupindia.gov.in/content/sih/en/registration.html',
    officialNotificationPDF: 'https://www.startupindia.gov.in/content/dam/g2b-content/Guidance.pdf',
    ministry: 'Ministry of Commerce & Industry',
    launchYear: 2016,
    lastVerifiedDate: '2026-07-14',
    priorityScore: 8,
    requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Incorporation Certificate'],
    recommendedDocuments: [],
    renewable: false,
    tags: ['Startup', 'Business', 'Tax Holiday', 'Funding', 'Central'],
    category: 'Startup',
    subcategory: 'Business Support',
    name: 'Startup India Initiative',
    shortDescription: 'Tax holidays, funding support, and fast-track patents for startups.',
    fullDescription: 'A flagship initiative of the Government of India to support startups.',
    targetAudience: 'Entrepreneurs and early-stage startup founders',
    minAge: 18,
    maxAge: undefined,
    studentEligible: true,
    farmerEligible: true,
    seniorCitizenEligible: true,
    disabledEligible: true
  }
];

// Helper to locally map SchemeRecords without circular imports during parse
function evaluateSchemeLocally(record: any): Scheme {
  const resolvedRequiredDocs: RequiredDocument[] = record.requiredDocuments.map((docName: string, idx: number) => ({
    id: `${record.schemeId}-doc-${idx}`,
    name: docName,
    iconName: docName.toLowerCase().includes('aadhaar') ? 'card-account-details' : 'file-document-outline',
    status: 'missing' as const,
    description: `Official ${docName} verification document`
  }));

  const criteria: EligibilityCriterion[] = [
    { id: 'age', label: 'Age Eligibility', required: record.ageRange, userValue: '28 years', passed: true },
    { id: 'gender', label: 'Gender Target', required: record.gender, userValue: 'Male', passed: true },
    { id: 'income', label: 'Income Limit', required: record.incomeLimit, userValue: 'EWS', passed: true },
    { id: 'state', label: 'State Residency', required: record.state, userValue: 'Maharashtra', passed: true },
    { id: 'occupation', label: 'Occupation Match', required: record.occupation, userValue: 'Self-Employed', passed: true }
  ];

  return {
    id: record.schemeId,
    title: record.title,
    shortTitle: record.subtitle,
    department: record.ministry,
    ministry: record.ministry,
    category: record.category as any,
    type: (record.state === 'All' ? 'Central' : 'State') as any,
    state: record.state === 'All' ? undefined : record.state,
    description: record.description,
    benefits: record.benefits,
    financialAssistance: record.benefits[0] || 'Guaranteed benefits',
    applicationPeriod: `${record.applicationStart} to ${record.applicationEnd}`,
    renewable: record.renewable,
    deadline: record.applicationEnd === 'Permanent' ? 'Open Enrollment' : record.applicationEnd,
    processingTime: '15-30 working days',
    applicationFee: 0,
    officialPortal: record.officialWebsite,
    eligibilityPercentage: 100,
    eligibilityStatus: 'eligible' as const,
    eligibilityCriteria: criteria,
    requiredDocuments: resolvedRequiredDocs,
    recommendedDocuments: [],
    faqs: [
      { id: 'faq-1', question: `How to apply?`, answer: `Visit ${record.officialApplyLink}` }
    ],

    accentColor: '#2196F3',
    iconName: 'shield-check-outline',
    tags: record.tags,

    // Database fields mapping
    name: record.title,
    shortDescription: record.subtitle,
    fullDescription: record.description,
    subcategory: record.subtitle,
    targetAudience: 'Indian Citizens',
    minAge: record.ageRange === 'All' ? 0 : parseInt(record.ageRange.split('-')[0], 10),
    maxAge: record.ageRange === 'All' ? undefined : (record.ageRange.split('-')[1] ? parseInt(record.ageRange.split('-')[1], 10) : undefined),
    gender: record.gender,
    incomeLimit: record.incomeLimit,
    occupation: record.occupation,
    studentEligible: record.occupation === 'Student' || record.tags.includes('Student'),
    farmerEligible: record.occupation === 'Farmer' || record.tags.includes('Farmers'),
    seniorCitizenEligible: record.tags.includes('Senior Citizens') || record.ageRange.includes('70'),
    disabledEligible: record.tags.includes('Disabled'),
    documentsRequired: record.documentsRequired,
    officialWebsite: record.officialWebsite,
    officialApplyLink: record.officialApplyLink,
    launchYear: record.launchYear,
    applicationMode: record.applicationMode,
    status: record.status,

    version: record.version || 1,
    lastUpdated: record.lastUpdated || record.lastVerifiedDate || '',
    officialNotification: record.officialNotification || record.officialNotificationPDF || ''
  };
}

export const SCHEMES: Scheme[] = BASE_SCHEMES_DATA.map(r => evaluateSchemeLocally(r));

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getEligibleSchemes(): Scheme[] {
  return SCHEMES.filter(
    (s) => s.eligibilityStatus === 'eligible' || s.eligibilityStatus === 'partially_eligible'
  );
}

export function getSchemeById(
  id: string,
  user: VaultGovUser | null = null,
  userDocs: VaultGovDocument[] = []
): Scheme | undefined {
  const record = BASE_SCHEMES_DATA.find((s) => s.schemeId === id);
  if (!record) return undefined;
  
  // Lazy evaluation using the SchemeRepository
  try {
    const { SchemeRepository } = require('@/services/schemes/SchemeRepository');
    return SchemeRepository.evaluateScheme(record, user, userDocs);
  } catch (err) {
    // Failover to local map if import fails (e.g. during bundler start)
    return evaluateSchemeLocally(record);
  }
}

export function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(100000 + Math.random() * 899999);
  return `VG-${year}-${num}`;
}

export function getDocumentStatusColor(status: DocumentStatus): string {
  switch (status) {
    case 'verified':
      return '#3CC556';
    case 'uploaded':
      return '#1977F3';
    case 'expired':
      return '#FF9800';
    case 'missing':
      return '#FF3B30';
    default:
      return '#707070';
  }
}

export function getDocumentStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'uploaded':
      return 'Uploaded';
    case 'expired':
      return 'Expired';
    case 'missing':
      return 'Missing';
    default:
      return status;
  }
}

export function getApplicationStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'under_review':
      return 'Under Review';
    case 'documents_requested':
      return 'Documents Requested';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

export function getApplicationStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case 'submitted':
      return '#1977F3';
    case 'under_review':
      return '#FF9800';
    case 'documents_requested':
      return '#9C27B0';
    case 'approved':
      return '#3CC556';
    case 'rejected':
      return '#FF3B30';
    default:
      return '#707070';
  }
}
