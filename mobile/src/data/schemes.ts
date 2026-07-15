// ─── VaultGov AI — Government Schemes Data ───────────────────────────────────

export type SchemeCategory =
  | 'Education'
  | 'Agriculture'
  | 'Health'
  | 'Housing'
  | 'Skill Development'
  | 'Technology'
  | 'Women & Child'
  | 'Pension';

export type SchemeType = 'Central' | 'State';
export type EligibilityStatus = 'eligible' | 'partially_eligible' | 'not_eligible';
export type DocumentStatus = 'uploaded' | 'missing' | 'expired' | 'verified';
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
  faqs: FAQ[];
  accentColor: string;
  iconName: string;
  tags: string[];
}

export interface AppliedScheme {
  schemeId: string;
  applicationId: string;
  applicationDate: string;
  status: ApplicationStatus;
  submittedAt: string;
}



// ─── Scheme Data ──────────────────────────────────────────────────────────────

export const SCHEMES: Scheme[] = [
  // ── 1. Student Scholarship ─────────────────────────────────────────────────
  {
    id: 'scheme-001',
    title: 'National Scholarship Portal — Central Scholarship',
    shortTitle: 'Student Scholarship',
    department: 'Department of Higher Education',
    ministry: 'Ministry of Education',
    category: 'Education',
    type: 'Central',
    description:
      'The National Scholarship Portal is a one-stop solution for students seeking scholarships from Central and State Governments. It provides merit-cum-means financial assistance to students from economically weaker sections to pursue professional and technical courses across India.',
    benefits: [
      'Financial assistance of ₹10,000 to ₹50,000 per year',
      'Direct Benefit Transfer to student bank account',
      'Non-repayable grant — not a loan',
      'Renewable for full duration of course',
      'Covers tuition fees, books, and living expenses',
    ],
    financialAssistance: '₹10,000 – ₹50,000 per annum',
    applicationPeriod: 'July 1 – October 31 annually',
    renewable: true,
    renewalPeriod: 'Annual renewal on merit basis',
    deadline: 'Oct 31, 2026',
    processingTime: '30–60 working days',
    applicationFee: 0,
    officialPortal: 'https://scholarships.gov.in',
    eligibilityPercentage: 38,
    eligibilityStatus: 'not_eligible',
    eligibilityCriteria: [
      {
        id: 'ec-001-1',
        label: 'Age Requirement',
        required: '17–25 years',
        userValue: '28 years',
        passed: false,
        reason: 'Your age (28) exceeds the maximum age limit of 25 years for this scholarship.',
      },
      {
        id: 'ec-001-2',
        label: 'Annual Family Income',
        required: 'Below ₹2,50,000',
        userValue: '₹2,80,000',
        passed: false,
        reason: 'Your annual income (₹2,80,000) exceeds the eligibility limit of ₹2,50,000.',
      },
      {
        id: 'ec-001-3',
        label: 'Education Level',
        required: '10th / 12th Pass or pursuing UG / PG',
        userValue: 'Graduate',
        passed: true,
      },
      {
        id: 'ec-001-4',
        label: 'Indian Citizenship',
        required: 'Indian Citizen',
        userValue: 'Indian Citizen',
        passed: true,
      },
    ],
    requiredDocuments: [
      {
        id: 'rd-001-1',
        name: 'Aadhaar Card',
        iconName: 'card-account-details',
        status: 'verified',
        description: 'Government issued Aadhaar card',
      },
      {
        id: 'rd-001-2',
        name: 'Income Certificate',
        iconName: 'file-document',
        status: 'missing',
        description: 'Issued by competent authority (less than 1 year old)',
      },
      {
        id: 'rd-001-3',
        name: 'Educational Certificate',
        iconName: 'school',
        status: 'uploaded',
        description: 'Last qualifying exam marksheet',
      },
      {
        id: 'rd-001-4',
        name: 'Bank Passbook',
        iconName: 'bank',
        status: 'verified',
        description: 'Active bank account linked to Aadhaar',
      },
      {
        id: 'rd-001-5',
        name: 'Passport Size Photo',
        iconName: 'camera-account',
        status: 'uploaded',
        description: 'Recent colour photograph on white background',
      },
      {
        id: 'rd-001-6',
        name: 'Caste Certificate',
        iconName: 'file-certificate',
        status: 'missing',
        description: 'Required for SC / ST / OBC categories only',
      },
    ],
    faqs: [
      {
        id: 'faq-001-1',
        question: 'Can I apply for multiple scholarships simultaneously?',
        answer:
          'No, you can apply for only one Central Government scholarship per academic year through the National Scholarship Portal.',
      },
      {
        id: 'faq-001-2',
        question: 'When is the scholarship amount disbursed?',
        answer:
          "The scholarship amount is directly transferred to the student's bank account within 60 days after successful processing and verification.",
      },
      {
        id: 'faq-001-3',
        question: 'Is this scholarship renewable every year?',
        answer:
          'Yes, the scholarship is renewable annually provided the student maintains the required attendance and academic performance.',
      },
    ],
    accentColor: '#4CAF50',
    iconName: 'school',
    tags: ['Education', 'Scholarship', 'Students', 'Central'],
  },

  // ── 2. PM Kisan ────────────────────────────────────────────────────────────
  {
    id: 'scheme-002',
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    shortTitle: 'PM Kisan',
    department: 'Department of Agriculture & Farmers Welfare',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture',
    type: 'Central',
    description:
      'PM-KISAN is a Central Sector Scheme providing income support to all landholding farmer families across India. Under this scheme, financial support of ₹6,000 per year is provided in three equal instalments of ₹2,000 each every four months, directly credited to the bank account.',
    benefits: [
      'Income support of ₹6,000 per year (₹2,000 per instalment)',
      'Direct credit to bank account every 4 months',
      'No middlemen — 100% Direct Benefit Transfer',
      'Covers all land-holding farmers across India',
      'Additional state government top-ups in select states',
    ],
    financialAssistance: '₹6,000 per annum (₹2,000 × 3 instalments)',
    applicationPeriod: 'Rolling — apply anytime',
    renewable: true,
    renewalPeriod: 'Auto-renewed annually upon eKYC verification',
    deadline: 'No fixed deadline',
    processingTime: '45–90 working days',
    applicationFee: 0,
    officialPortal: 'https://pmkisan.gov.in',
    eligibilityPercentage: 15,
    eligibilityStatus: 'not_eligible',
    eligibilityCriteria: [
      {
        id: 'ec-002-1',
        label: 'Occupation',
        required: 'Farmer / Agricultural Land Holder',
        userValue: 'Self-Employed',
        passed: false,
        reason:
          'This scheme is exclusively for farmers. Your occupation does not meet the eligibility criteria.',
      },
      {
        id: 'ec-002-2',
        label: 'Land Ownership',
        required: 'Must own cultivable agricultural land',
        userValue: 'Not a land owner',
        passed: false,
        reason: 'You must own agricultural land to be eligible for PM-KISAN.',
      },
      {
        id: 'ec-002-3',
        label: 'Indian Citizenship',
        required: 'Indian Citizen',
        userValue: 'Indian Citizen',
        passed: true,
      },
      {
        id: 'ec-002-4',
        label: 'Age',
        required: '18 years or above',
        userValue: '28 years',
        passed: true,
      },
    ],
    requiredDocuments: [
      { id: 'rd-002-1', name: 'Aadhaar Card', iconName: 'card-account-details', status: 'verified' },
      {
        id: 'rd-002-2',
        name: 'Land Ownership Documents',
        iconName: 'file-document-multiple',
        status: 'missing',
        description: 'Khasra / Khatauni or 7/12 extract',
      },
      { id: 'rd-002-3', name: 'Bank Passbook', iconName: 'bank', status: 'verified' },
      {
        id: 'rd-002-4',
        name: 'Aadhaar-Linked Mobile Number',
        iconName: 'cellphone',
        status: 'verified',
      },
    ],
    faqs: [
      {
        id: 'faq-002-1',
        question: 'What is the instalment schedule for PM-KISAN?',
        answer:
          'The three instalments are released in April–July, August–November, and December–March each year.',
      },
      {
        id: 'faq-002-2',
        question: 'Can I apply online for PM-KISAN?',
        answer:
          'Yes, you can register online at pmkisan.gov.in or visit your nearest Common Service Centre (CSC).',
      },
    ],
    accentColor: '#FF9800',
    iconName: 'sprout',
    tags: ['Agriculture', 'Farmers', 'Income Support', 'Central'],
  },

  // ── 3. Ayushman Bharat ────────────────────────────────────────────────────
  {
    id: 'scheme-003',
    title: 'Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana',
    shortTitle: 'Ayushman Bharat',
    department: 'National Health Authority',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Health',
    type: 'Central',
    description:
      "Ayushman Bharat PM-JAY is the world's largest health assurance scheme, providing coverage of up to ₹5 lakh per family per year for secondary and tertiary care hospitalisation. Cashless treatment is available at any empanelled government or private hospital across India.",
    benefits: [
      'Health cover of ₹5 lakh per family per year',
      'Cashless treatment at empanelled hospitals',
      'Pre-existing conditions covered from Day 1',
      '1,929+ medical procedures covered',
      'No cap on family size',
      'Pre and post-hospitalisation expenses included',
      'Transportation allowance provided',
    ],
    financialAssistance: '₹5,00,000 per family per year (health insurance)',
    applicationPeriod: 'Rolling — apply anytime',
    renewable: true,
    renewalPeriod: 'Annual renewal',
    deadline: 'No fixed deadline',
    processingTime: '7–15 working days',
    applicationFee: 0,
    officialPortal: 'https://pmjay.gov.in',
    eligibilityPercentage: 92,
    eligibilityStatus: 'eligible',
    eligibilityCriteria: [
      {
        id: 'ec-003-1',
        label: 'Annual Family Income',
        required: 'Below ₹5,00,000',
        userValue: '₹2,80,000',
        passed: true,
      },
      {
        id: 'ec-003-2',
        label: 'Age',
        required: '18 years or above',
        userValue: '28 years',
        passed: true,
      },
      {
        id: 'ec-003-3',
        label: 'Indian Citizenship',
        required: 'Indian Citizen',
        userValue: 'Indian Citizen',
        passed: true,
      },
      {
        id: 'ec-003-4',
        label: 'Aadhaar Linkage',
        required: 'Aadhaar linked to mobile',
        userValue: 'Linked',
        passed: true,
      },
    ],
    requiredDocuments: [
      {
        id: 'rd-003-1',
        name: 'Aadhaar Card',
        iconName: 'card-account-details',
        status: 'verified',
      },
      {
        id: 'rd-003-2',
        name: 'Ration Card / SECC Data',
        iconName: 'file-document',
        status: 'missing',
        description: 'Socio-Economic Caste Census 2011 data or ration card',
      },
      {
        id: 'rd-003-3',
        name: 'Income Certificate',
        iconName: 'currency-inr',
        status: 'missing',
        description: 'Required if not covered under SECC',
      },
      {
        id: 'rd-003-4',
        name: 'Passport Size Photo',
        iconName: 'camera-account',
        status: 'uploaded',
      },
      {
        id: 'rd-003-5',
        name: 'Aadhaar-Linked Mobile Number',
        iconName: 'cellphone',
        status: 'verified',
      },
    ],
    faqs: [
      {
        id: 'faq-003-1',
        question: 'Can I get treatment at any hospital?',
        answer:
          'You can get cashless treatment at any empanelled government or private hospital. Check the hospital list on the PMJAY website or mobile app.',
      },
      {
        id: 'faq-003-2',
        question: 'Is the ₹5 lakh limit per person or per family?',
        answer:
          'The ₹5 lakh limit is per family per year. The same pool can be used by any member of the family.',
      },
      {
        id: 'faq-003-3',
        question: 'Are pre-existing diseases covered?',
        answer:
          'Yes, all pre-existing conditions are covered from Day 1 with no waiting period whatsoever.',
      },
    ],
    accentColor: '#F44336',
    iconName: 'hospital-box',
    tags: ['Health', 'Insurance', 'Medical', 'Central', 'Cashless'],
  },

  // ── 4. PM Awas Yojana ─────────────────────────────────────────────────────
  {
    id: 'scheme-004',
    title: 'Pradhan Mantri Awas Yojana — Urban (PMAY-U)',
    shortTitle: 'PM Awas Yojana',
    department: 'Ministry of Housing & Urban Affairs',
    ministry: 'Ministry of Housing & Urban Affairs',
    category: 'Housing',
    type: 'Central',
    description:
      'PMAY-U provides financial assistance for construction and purchase of affordable houses to eligible urban households. The scheme aims to provide housing to all eligible families from EWS, LIG, and MIG categories through Credit Linked Subsidy Scheme (CLSS) and direct central assistance.',
    benefits: [
      'Interest subsidy up to 6.5% on housing loans',
      'Credit Linked Subsidy up to ₹2.67 lakh (EWS/LIG)',
      'Loan subsidies for amounts up to ₹12 lakh (MIG-I)',
      'Loan subsidies for amounts up to ₹18 lakh (MIG-II)',
      'Direct Central Assistance of ₹1.5 lakh (EWS/LIG)',
    ],
    financialAssistance: 'Credit Linked Subsidy: ₹1,50,000 – ₹2,67,280',
    applicationPeriod: 'December 2024 – March 2027',
    renewable: false,
    deadline: 'Dec 31, 2026',
    processingTime: '60–90 working days',
    applicationFee: 0,
    officialPortal: 'https://pmaymis.gov.in',
    eligibilityPercentage: 88,
    eligibilityStatus: 'eligible',
    eligibilityCriteria: [
      {
        id: 'ec-004-1',
        label: 'Age',
        required: '21 years or above',
        userValue: '28 years',
        passed: true,
      },
      {
        id: 'ec-004-2',
        label: 'Annual Family Income',
        required: 'Below ₹18,00,000 (MIG-II)',
        userValue: '₹2,80,000 (EWS eligible)',
        passed: true,
      },
      {
        id: 'ec-004-3',
        label: 'Existing House Ownership',
        required: "No pucca house in applicant's or spouse's name",
        userValue: 'No existing house',
        passed: true,
      },
      {
        id: 'ec-004-4',
        label: 'Indian Citizenship',
        required: 'Indian Citizen',
        userValue: 'Indian Citizen',
        passed: true,
      },
    ],
    requiredDocuments: [
      { id: 'rd-004-1', name: 'Aadhaar Card', iconName: 'card-account-details', status: 'verified' },
      { id: 'rd-004-2', name: 'PAN Card', iconName: 'card-text', status: 'verified' },
      {
        id: 'rd-004-3',
        name: 'Income Certificate',
        iconName: 'file-document',
        status: 'missing',
        description: 'Proof of annual family income',
      },
      {
        id: 'rd-004-4',
        name: 'Self-Declaration (No House)',
        iconName: 'file-sign',
        status: 'missing',
        description: 'Affidavit that no pucca house is owned',
      },
      { id: 'rd-004-5', name: 'Bank Passbook', iconName: 'bank', status: 'verified' },
      {
        id: 'rd-004-6',
        name: 'Residence Certificate',
        iconName: 'home-city',
        status: 'uploaded',
      },
      {
        id: 'rd-004-7',
        name: 'Passport Size Photo',
        iconName: 'camera-account',
        status: 'uploaded',
      },
    ],
    faqs: [
      {
        id: 'faq-004-1',
        question: 'Who is eligible under the EWS category?',
        answer:
          'Households with annual income up to ₹3 lakh fall under the Economically Weaker Section (EWS) category and receive the maximum subsidy benefit.',
      },
      {
        id: 'faq-004-2',
        question: 'Can a single woman apply for PMAY?',
        answer:
          'Yes. For EWS and LIG categories, the house must be in the name of the female head of the household or jointly with the male head.',
      },
      {
        id: 'faq-004-3',
        question: 'How long does the interest subsidy last?',
        answer:
          'The subsidy is applicable for the loan tenure or 20 years, whichever is lower, and is credited upfront to the loan account.',
      },
    ],
    accentColor: '#2196F3',
    iconName: 'home-city',
    tags: ['Housing', 'Subsidy', 'Urban', 'Central', 'EWS', 'LIG'],
  },

  // ── 5. Skill India ────────────────────────────────────────────────────────
  {
    id: 'scheme-005',
    title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
    shortTitle: 'Skill India',
    department: 'National Skill Development Corporation',
    ministry: 'Ministry of Skill Development & Entrepreneurship',
    category: 'Skill Development',
    type: 'Central',
    description:
      'PMKVY is the flagship scheme of the Ministry of Skill Development & Entrepreneurship. Free skill training and certification is provided to youth to help them take up industry-relevant job roles that improve their livelihood and employment opportunities across 35+ sectors.',
    benefits: [
      'Free skill training in 300+ job roles',
      'Monetary reward upon successful certification',
      'Government-recognised NSQF-linked certificate',
      'Placement assistance post-training',
      'Post-placement support for 3 months',
      '₹8,000 stipend during training (residential batches)',
    ],
    financialAssistance: 'Free training + Monetary reward up to ₹8,000',
    applicationPeriod: 'Rolling — batches available year-round',
    renewable: false,
    deadline: 'Mar 31, 2027',
    processingTime: '3–6 months (training + certification)',
    applicationFee: 0,
    officialPortal: 'https://pmkvyofficial.org',
    eligibilityPercentage: 95,
    eligibilityStatus: 'eligible',
    eligibilityCriteria: [
      {
        id: 'ec-005-1',
        label: 'Age',
        required: '15–45 years',
        userValue: '28 years',
        passed: true,
      },
      {
        id: 'ec-005-2',
        label: 'Indian Citizenship',
        required: 'Indian Citizen',
        userValue: 'Indian Citizen',
        passed: true,
      },
      {
        id: 'ec-005-3',
        label: 'Aadhaar Enrollment',
        required: 'Aadhaar enrolled',
        userValue: 'Aadhaar verified',
        passed: true,
      },
      {
        id: 'ec-005-4',
        label: 'Employment Status',
        required: 'Unemployed / Under-employed / School dropout',
        userValue: 'Self-Employed',
        passed: true,
      },
    ],
    requiredDocuments: [
      { id: 'rd-005-1', name: 'Aadhaar Card', iconName: 'card-account-details', status: 'verified' },
      {
        id: 'rd-005-2',
        name: 'Educational Certificate',
        iconName: 'school',
        status: 'uploaded',
        description: 'Last qualification certificate',
      },
      {
        id: 'rd-005-3',
        name: 'Passport Size Photo',
        iconName: 'camera-account',
        status: 'uploaded',
      },
      { id: 'rd-005-4', name: 'Bank Passbook', iconName: 'bank', status: 'verified' },
    ],
    faqs: [
      {
        id: 'faq-005-1',
        question: 'How do I find a training centre near me?',
        answer:
          'Visit the PMKVY website or the Skill India portal to find a Training Partner near you by entering your pin code or district.',
      },
      {
        id: 'faq-005-2',
        question: 'Is the certificate recognised by employers?',
        answer:
          'Yes, PMKVY certificates are NSDC-recognised and linked to the National Skills Qualification Framework (NSQF) which is accepted across industries.',
      },
      {
        id: 'faq-005-3',
        question: 'Can I choose any skill sector?',
        answer:
          'Yes, you can choose from 35+ sectors including IT, Healthcare, Construction, Retail, Hospitality, and many more.',
      },
    ],
    accentColor: '#9C27B0',
    iconName: 'school',
    tags: ['Skills', 'Training', 'Youth', 'Central', 'Employment'],
  },

  // ── 6. Digital India Internship ───────────────────────────────────────────
  {
    id: 'scheme-006',
    title: 'Digital India Internship Scheme (DIIS)',
    shortTitle: 'Digital India Internship',
    department: 'Ministry of Electronics & Information Technology',
    ministry: 'Ministry of Electronics & Information Technology',
    category: 'Technology',
    type: 'Central',
    description:
      'The Digital India Internship Scheme offers students and graduates an opportunity to work with Government of India Ministries and Departments for 2 months. Interns gain hands-on experience in e-governance, policy formulation, and digital transformation initiatives at a national level.',
    benefits: [
      'Stipend of ₹10,000 per month (₹20,000 total)',
      'Practical experience in government IT projects',
      'Certificate from Ministry of Electronics & IT',
      'Exposure to national-level digital initiatives',
      'Mentorship from senior government officials',
      'Letter of recommendation on successful completion',
    ],
    financialAssistance: '₹10,000/month stipend for 2 months',
    applicationPeriod: 'Twice a year — Jan–Feb and Jul–Aug',
    renewable: false,
    deadline: 'Aug 15, 2026',
    processingTime: '15–30 working days',
    applicationFee: 0,
    officialPortal: 'https://internship.meity.gov.in',
    eligibilityPercentage: 90,
    eligibilityStatus: 'eligible',
    eligibilityCriteria: [
      {
        id: 'ec-006-1',
        label: 'Age',
        required: '18–30 years',
        userValue: '28 years',
        passed: true,
      },
      {
        id: 'ec-006-2',
        label: 'Education',
        required: 'Pursuing or completed UG / PG degree',
        userValue: 'Graduate',
        passed: true,
      },
      {
        id: 'ec-006-3',
        label: 'Indian Citizenship',
        required: 'Indian Citizen',
        userValue: 'Indian Citizen',
        passed: true,
      },
      {
        id: 'ec-006-4',
        label: 'Academic Performance',
        required: '60% or above in last qualifying exam',
        userValue: 'Assumed to be met',
        passed: true,
      },
    ],
    requiredDocuments: [
      { id: 'rd-006-1', name: 'Aadhaar Card', iconName: 'card-account-details', status: 'verified' },
      {
        id: 'rd-006-2',
        name: 'Educational Certificate / Marksheet',
        iconName: 'school',
        status: 'uploaded',
      },
      {
        id: 'rd-006-3',
        name: 'Resume / CV',
        iconName: 'file-account',
        status: 'missing',
        description: 'Updated resume (maximum 2 pages)',
      },
      {
        id: 'rd-006-4',
        name: 'Passport Size Photo',
        iconName: 'camera-account',
        status: 'uploaded',
      },
      { id: 'rd-006-5', name: 'Bank Passbook', iconName: 'bank', status: 'verified' },
      {
        id: 'rd-006-6',
        name: 'College ID / NOC',
        iconName: 'badge-account',
        status: 'missing',
        description: 'Required if currently pursuing degree',
      },
    ],
    faqs: [
      {
        id: 'faq-006-1',
        question: 'Is the internship remote or on-site?',
        answer:
          'The internship is primarily on-site at Ministry offices in New Delhi, with some departments offering hybrid arrangements.',
      },
      {
        id: 'faq-006-2',
        question: 'How are interns selected?',
        answer:
          'Selection is based on academic merit, statement of purpose, and shortlisting by the respective Ministry or Department.',
      },
      {
        id: 'faq-006-3',
        question: 'Can I apply to multiple departments?',
        answer: 'Yes, you can apply to a maximum of 3 departments in one application cycle.',
      },
    ],
    accentColor: '#00BCD4',
    iconName: 'laptop',
    tags: ['Technology', 'Internship', 'Youth', 'IT', 'Central'],
  },

  // ── 7. Ladli Scheme ───────────────────────────────────────────────────────
  {
    id: 'scheme-007',
    title: 'Ladli Laxmi Yojana',
    shortTitle: 'Ladli Scheme',
    department: 'Department of Women & Child Development',
    ministry: 'Ministry of Women & Child Development',
    category: 'Women & Child',
    type: 'State',
    state: 'Madhya Pradesh',
    description:
      'Ladli Laxmi Yojana is a Madhya Pradesh state government scheme for the welfare and empowerment of the girl child. National Savings Certificates worth ₹1,43,000 are deposited in the name of the girl child over 5 years, with additional scholarship and marriage assistance milestones.',
    benefits: [
      'NSC investment of ₹1,43,000 over 5 years',
      '₹2,000 scholarship at Class 6 admission',
      '₹4,000 scholarship at Class 9 admission',
      '₹6,000 scholarship at Class 11 and 12 admission',
      '₹25,000 at 12th standard passing',
      '₹1,00,000 at age 21 upon graduation and marriage',
    ],
    financialAssistance: '₹1,43,000 phased disbursement over 21 years',
    applicationPeriod: 'Within 1 year of birth',
    renewable: false,
    deadline: 'Registration within 1 year of birth',
    processingTime: '30–45 working days',
    applicationFee: 0,
    officialPortal: 'https://ladlilaxmi.mp.gov.in',
    eligibilityPercentage: 0,
    eligibilityStatus: 'not_eligible',
    eligibilityCriteria: [
      {
        id: 'ec-007-1',
        label: 'Gender',
        required: 'Female (Girl Child)',
        userValue: 'Male',
        passed: false,
        reason: 'This scheme is exclusively for girl children. Your gender does not qualify.',
      },
      {
        id: 'ec-007-2',
        label: 'State of Residence',
        required: 'Madhya Pradesh',
        userValue: 'Maharashtra',
        passed: false,
        reason: 'This is a Madhya Pradesh state scheme. Residents of Maharashtra are not eligible.',
      },
      {
        id: 'ec-007-3',
        label: 'Age at Registration',
        required: 'Below 1 year (at registration)',
        userValue: '28 years',
        passed: false,
        reason: "Registration must happen within 1 year of the girl child's birth.",
      },
    ],
    requiredDocuments: [
      {
        id: 'rd-007-1',
        name: 'Birth Certificate',
        iconName: 'certificate',
        status: 'missing',
      },
      {
        id: 'rd-007-2',
        name: 'Aadhaar Card (Parent)',
        iconName: 'card-account-details',
        status: 'verified',
      },
      {
        id: 'rd-007-3',
        name: 'MP Residence Certificate',
        iconName: 'home-city',
        status: 'missing',
      },
      { id: 'rd-007-4', name: 'Bank Passbook', iconName: 'bank', status: 'verified' },
    ],
    faqs: [
      {
        id: 'faq-007-1',
        question: 'Is this scheme available in all states?',
        answer:
          'No, Ladli Laxmi Yojana is a Madhya Pradesh state scheme. Other states have similar programs like Ladli Behna (MP) or Beti Bachao Beti Padhao (Central).',
      },
      {
        id: 'faq-007-2',
        question: 'When can the final ₹1,00,000 be withdrawn?',
        answer:
          "The final amount is payable when the girl child turns 21, provided she has passed Class 12 and has not married before age 18.",
      },
    ],
    accentColor: '#E91E63',
    iconName: 'human-female',
    tags: ['Women', 'Girl Child', 'State', 'MP', 'Education'],
  },

  // ── 8. National Pension Scheme ────────────────────────────────────────────
  {
    id: 'scheme-008',
    title: 'National Pension System (NPS) — All Citizen Model',
    shortTitle: 'National Pension Scheme',
    department: 'Pension Fund Regulatory & Development Authority',
    ministry: 'Ministry of Finance',
    category: 'Pension',
    type: 'Central',
    description:
      'The National Pension System (NPS) is a voluntary, defined contribution retirement savings scheme regulated by PFRDA. Any Indian citizen between 18–70 years can open an NPS account, invest across equity, corporate bonds, and government securities, and enjoy significant tax benefits under multiple sections.',
    benefits: [
      'Market-linked returns (historically 8–10% p.a.)',
      'Tax deduction up to ₹1.5 lakh under Section 80C',
      'Additional ₹50,000 deduction under Section 80CCD(1B)',
      'Portable across jobs and locations nationwide',
      'Choice of Pension Fund Manager and investment mix',
      'Partial withdrawal allowed after 3 years',
    ],
    financialAssistance: 'Retirement corpus + tax savings (market-linked)',
    applicationPeriod: 'Open year-round',
    renewable: true,
    renewalPeriod: 'Annual contribution required',
    deadline: 'No deadline — enrol anytime',
    processingTime: '3–7 working days',
    applicationFee: 0,
    officialPortal: 'https://enps.nsdl.com',
    eligibilityPercentage: 85,
    eligibilityStatus: 'eligible',
    eligibilityCriteria: [
      {
        id: 'ec-008-1',
        label: 'Age',
        required: '18–70 years',
        userValue: '28 years',
        passed: true,
      },
      {
        id: 'ec-008-2',
        label: 'Indian Citizenship',
        required: 'Indian Citizen (Resident / NRI / OCI)',
        userValue: 'Indian Citizen',
        passed: true,
      },
      {
        id: 'ec-008-3',
        label: 'Aadhaar & PAN',
        required: 'Valid Aadhaar and PAN card',
        userValue: 'Both verified',
        passed: true,
      },
      {
        id: 'ec-008-4',
        label: 'KYC Compliance',
        required: 'KYC documents must be valid and current',
        userValue: 'KYC documents available',
        passed: true,
      },
    ],
    requiredDocuments: [
      {
        id: 'rd-008-1',
        name: 'Aadhaar Card',
        iconName: 'card-account-details',
        status: 'verified',
      },
      { id: 'rd-008-2', name: 'PAN Card', iconName: 'card-text', status: 'verified' },
      {
        id: 'rd-008-3',
        name: 'Bank Passbook / Cancelled Cheque',
        iconName: 'bank',
        status: 'verified',
      },
      {
        id: 'rd-008-4',
        name: 'Passport Size Photo',
        iconName: 'camera-account',
        status: 'uploaded',
      },
      {
        id: 'rd-008-5',
        name: 'Residence Proof',
        iconName: 'home-city',
        status: 'uploaded',
      },
    ],
    faqs: [
      {
        id: 'faq-008-1',
        question: 'What is the minimum contribution per year?',
        answer:
          'For Tier I (mandatory) account, the minimum is ₹500 per transaction and ₹1,000 per year. For Tier II (voluntary), the minimum is ₹250.',
      },
      {
        id: 'faq-008-2',
        question: 'When can I withdraw my NPS corpus?',
        answer:
          'Full withdrawal is allowed at age 60. At least 40% of the corpus must be used to buy an annuity; the remaining 60% can be withdrawn as a lump sum.',
      },
      {
        id: 'faq-008-3',
        question: 'Can I change my Fund Manager later?',
        answer:
          'Yes, you can change your Pension Fund Manager or investment allocation once per year through the CRA portal online.',
      },
    ],
    accentColor: '#607D8B',
    iconName: 'piggy-bank',
    tags: ['Pension', 'Retirement', 'Tax Benefits', 'Central', 'Investment'],
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getEligibleSchemes(): Scheme[] {
  return SCHEMES.filter(
    (s) => s.eligibilityStatus === 'eligible' || s.eligibilityStatus === 'partially_eligible'
  );
}

export function getSchemeById(id: string): Scheme | undefined {
  return SCHEMES.find((s) => s.id === id);
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
