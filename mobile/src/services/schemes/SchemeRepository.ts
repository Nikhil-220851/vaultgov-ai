import { SchemeRecord } from './types';
import {
  Scheme,
  RequiredDocument,
  EligibilityCriterion,
  EligibilityStatus,
  FAQ
} from '@/data/schemes';
import { VaultGovUser, VaultGovDocument } from '@/services/api';

/**
 * Checks if a required document has been uploaded by the user.
 */
export function hasUserUploadedDocument(requiredDocName: string, userDocs: VaultGovDocument[]): boolean {
  if (!userDocs || userDocs.length === 0) return false;
  const normalizedReq = requiredDocName.toLowerCase();
  
  return userDocs.some((userDoc) => {
    const docTitle = (userDoc.title || '').toLowerCase();
    const docCategory = (userDoc.category || '').toLowerCase();
    const docTags = (userDoc.tags || []).map(t => t.toLowerCase());
    
    // Direct matches
    if (docTitle.includes(normalizedReq) || normalizedReq.includes(docTitle)) {
      return true;
    }
    
    // Core document keyword rules
    if (normalizedReq.includes('aadhaar') && (docTitle.includes('aadhaar') || docTags.includes('aadhaar') || docTags.includes('uidai'))) {
      return true;
    }
    if (normalizedReq.includes('pan') && (docTitle.includes('pan') || docTags.includes('pan') || docTitle.includes('permanent account') || docTags.includes('permanent_account_number'))) {
      return true;
    }
    if ((normalizedReq.includes('driving') || normalizedReq.includes('license') || normalizedReq.includes('licence')) && 
        (docTitle.includes('driving') || docTitle.includes('dl') || docTags.includes('dl') || docTags.includes('driving_licence'))) {
      return true;
    }
    if (normalizedReq.includes('voter') && (docTitle.includes('voter') || docTags.includes('voter') || docTags.includes('epic') || docTitle.includes('election'))) {
      return true;
    }
    if (normalizedReq.includes('passport') && (docTitle.includes('passport') || docTags.includes('passport'))) {
      return true;
    }
    if (normalizedReq.includes('ration') && (docTitle.includes('ration') || docTags.includes('ration'))) {
      return true;
    }
    if (normalizedReq.includes('income') && (docTitle.includes('income') || docTags.includes('income') || docCategory.includes('income'))) {
      return true;
    }
    if ((normalizedReq.includes('caste') || normalizedReq.includes('community')) && 
        (docTitle.includes('caste') || docTitle.includes('community') || docTags.includes('caste') || docTags.includes('community'))) {
      return true;
    }
    if ((normalizedReq.includes('residence') || normalizedReq.includes('domicile') || normalizedReq.includes('address')) && 
        (docTitle.includes('residence') || docTitle.includes('domicile') || docTitle.includes('address') || docTags.includes('residence') || docTags.includes('domicile'))) {
      return true;
    }
    if (normalizedReq.includes('birth') && (docTitle.includes('birth') || docTags.includes('birth'))) {
      return true;
    }
    if ((normalizedReq.includes('education') || normalizedReq.includes('marksheet') || normalizedReq.includes('degree') || normalizedReq.includes('passing') || normalizedReq.includes('school') || normalizedReq.includes('college')) && 
        (docTitle.includes('marksheet') || docTitle.includes('degree') || docTitle.includes('passing') || docTitle.includes('certificate') || docTags.includes('education') || docTags.includes('marksheet') || docCategory.includes('education'))) {
      return true;
    }
    if (normalizedReq.includes('farmer') && (docTitle.includes('farmer') || docTitle.includes('land') || docTags.includes('farmer') || docTags.includes('land_record'))) {
      return true;
    }
    if (normalizedReq.includes('disability') && (docTitle.includes('disability') || docTitle.includes('disabled') || docTags.includes('disability'))) {
      return true;
    }
    if (normalizedReq.includes('bank') && (docTitle.includes('bank') || docTitle.includes('passbook') || docTags.includes('bank') || docTags.includes('passbook'))) {
      return true;
    }
    
    return false;
  });
}

/**
 * Calculates user age from ISO DOB string.
 */
function calculateAge(dobString: string | null): number | null {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  
  const today = new Date('2026-07-14'); // Current local time from metadata
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Maps the Income Slab categories EWS/LIG/MIG/HIG to values for threshold comparison.
 */
const INCOME_SLAB_VALUES: Record<string, number> = {
  'EWS': 1,
  'LIG': 2,
  'MIG': 3,
  'HIG': 4
};

export const SchemeRepository = {
  /**
   * Fallback mock user details (Maharashtra 28-year-old male EWS self-employed)
   * used when the profile context is empty/null, guaranteeing initial seeding runs properly.
   */
  getDefaultMockUser(): Partial<VaultGovUser> {
    return {
      date_of_birth: '1998-05-12',
      gender: 'Male',
      state: 'Maharashtra',
      district: 'Mumbai',
      occupation: 'Self-Employed',
      annual_income: 'EWS',
      profile_completed: false
    };
  },

  /**
   * Evaluates a database SchemeRecord against the user's demographic profile
   * and uploaded documents to produce the frontend-compatible Scheme UI model.
   */
  evaluateScheme(
    record: SchemeRecord,
    profileUser: VaultGovUser | null,
    userDocs: VaultGovDocument[]
  ): Scheme {
    const user = profileUser || (this.getDefaultMockUser() as VaultGovUser);
    const userAge = calculateAge(user.date_of_birth);
    
    // ─── 1. Age Range Match ───────────────────────────────────────────────────
    let agePassed = true;
    let ageReason = '';
    const ageRange = record.ageRange;
    
    if (ageRange && ageRange.toLowerCase() !== 'all' && ageRange.toLowerCase() !== 'any') {
      const parts = ageRange.split('-');
      const min = parseInt(parts[0], 10);
      const max = parts[1] ? parseInt(parts[1], 10) : 150;
      
      if (userAge !== null) {
        if (userAge < min) {
          agePassed = false;
          ageReason = `You are too young. This scheme requires minimum age of ${min} years (your age is ${userAge}).`;
        } else if (userAge > max) {
          agePassed = false;
          ageReason = `You exceed the maximum age limit of ${max} years for this scheme (your age is ${userAge}).`;
        }
      } else {
        agePassed = false;
        ageReason = 'Date of birth is not set in your profile.';
      }
    }
    
    // ─── 2. Gender Match ──────────────────────────────────────────────────────
    let genderPassed = true;
    let genderReason = '';
    const reqGender = record.gender;
    
    if (reqGender && reqGender.toLowerCase() !== 'all' && reqGender.toLowerCase() !== 'any') {
      if (user.gender) {
        if (reqGender.toLowerCase() !== user.gender.toLowerCase()) {
          genderPassed = false;
          genderReason = `This scheme is exclusively for ${reqGender} applicants (your gender is ${user.gender}).`;
        }
      } else {
        genderPassed = false;
        genderReason = 'Gender is not set in your profile.';
      }
    }

    // ─── 3. Income Limit Match ────────────────────────────────────────────────
    let incomePassed = true;
    let incomeReason = '';
    const reqIncome = record.incomeLimit; // EWS | LIG | MIG | HIG | All
    
    if (reqIncome && reqIncome.toLowerCase() !== 'all' && reqIncome.toLowerCase() !== 'any') {
      const userSlab = user.annual_income || 'HIG';
      const userVal = INCOME_SLAB_VALUES[userSlab] || 4;
      const reqVal = INCOME_SLAB_VALUES[reqIncome] || 4;
      
      if (userVal > reqVal) {
        incomePassed = false;
        incomeReason = `Your family income category (${userSlab}) exceeds the required slab for this scheme (${reqIncome}).`;
      }
    }

    // ─── 4. Location Match (State / District) ─────────────────────────────────
    let statePassed = true;
    let stateReason = '';
    const reqState = record.state;
    
    if (reqState && reqState.toLowerCase() !== 'all' && reqState.toLowerCase() !== 'any') {
      if (user.state) {
        if (reqState.toLowerCase() !== user.state.toLowerCase()) {
          statePassed = false;
          stateReason = `This scheme is restricted to residents of ${reqState} (your state is ${user.state}).`;
        }
      } else {
        statePassed = false;
        stateReason = 'State of residence is not set in your profile.';
      }
    }

    // ─── 5. Occupation Match ──────────────────────────────────────────────────
    let occupationPassed = true;
    let occupationReason = '';
    const reqOccupation = record.occupation;
    
    if (reqOccupation && reqOccupation.toLowerCase() !== 'any' && reqOccupation.toLowerCase() !== 'all') {
      const userOcc = (user.occupation || '').toLowerCase();
      const targetOcc = reqOccupation.toLowerCase();
      
      if (targetOcc === 'farmer' && !userOcc.includes('farmer') && !userOcc.includes('agri')) {
        occupationPassed = false;
        occupationReason = 'This scheme is specifically for farmers.';
      } else if (targetOcc === 'student' && !userOcc.includes('student') && !userOcc.includes('academic') && !userOcc.includes('education')) {
        occupationPassed = false;
        occupationReason = 'This scheme is specifically for students.';
      } else if (targetOcc === 'unorganized worker' && !userOcc.includes('unorganized') && !userOcc.includes('worker') && !userOcc.includes('labor') && !userOcc.includes('shram')) {
        occupationPassed = false;
        occupationReason = 'This scheme is for unorganized sector workers.';
      } else if (targetOcc === 'entrepreneur' && !userOcc.includes('entrepreneur') && !userOcc.includes('business') && !userOcc.includes('owner') && !userOcc.includes('startup')) {
        occupationPassed = false;
        occupationReason = 'This scheme is for entrepreneurs and business owners.';
      } else if (!userOcc.includes(targetOcc)) {
        occupationPassed = false;
        occupationReason = `This scheme is for individuals working as ${reqOccupation}.`;
      }
    }

    // ─── 6. Education Match ──────────────────────────────────────────────────
    let educationPassed = true;
    let educationReason = '';
    const reqEducation = record.education || 'Any';

    if (reqEducation && reqEducation.toLowerCase() !== 'any' && reqEducation.toLowerCase() !== 'all') {
      const hasMarksheet = userDocs.some(d => {
        const title = (d.title || '').toLowerCase();
        return title.includes('marksheet') || title.includes('degree') || title.includes('passing certificate') || title.includes('diploma') || title.includes('education');
      });
      
      const isGraduateScheme = reqEducation.toLowerCase() === 'graduate';
      const isSecondaryScheme = reqEducation.toLowerCase() === 'secondary';

      if (isGraduateScheme) {
        const hasDegreeDoc = userDocs.some(d => {
          const title = (d.title || '').toLowerCase();
          return title.includes('degree') || title.includes('graduation') || title.includes('convocation') || title.includes('bachelor') || title.includes('master');
        });
        const hasGradOccupation = ['unorganized worker', 'entrepreneur', 'business owner', 'self-employed', 'professional', 'officer', 'manager'].includes((user.occupation || '').toLowerCase());
        
        if (!hasDegreeDoc && !hasGradOccupation) {
          educationPassed = false;
          educationReason = 'This scheme requires a Graduate degree.';
        }
      } else if (isSecondaryScheme) {
        if (!hasMarksheet && userAge !== null && userAge < 15) {
          educationPassed = false;
          educationReason = 'This scheme requires a Secondary school education.';
        }
      }
    }

    // ─── 7. Documents Evaluation ──────────────────────────────────────────────
    // Resolve required document checklist with their current locker status
    const resolvedRequiredDocs: RequiredDocument[] = record.requiredDocuments.map((docName, idx) => {
      const uploaded = hasUserUploadedDocument(docName, userDocs);
      let iconName = 'file-document-outline';
      
      // Select appropriate icon
      const lowerName = docName.toLowerCase();
      if (lowerName.includes('aadhaar')) iconName = 'card-account-details';
      else if (lowerName.includes('pan')) iconName = 'card-text';
      else if (lowerName.includes('licence') || lowerName.includes('license') || lowerName.includes('dl')) iconName = 'car-limousine';
      else if (lowerName.includes('school') || lowerName.includes('college') || lowerName.includes('education') || lowerName.includes('marksheet') || lowerName.includes('degree')) iconName = 'school';
      else if (lowerName.includes('bank') || lowerName.includes('passbook')) iconName = 'bank';
      else if (lowerName.includes('photo')) iconName = 'camera-account';
      else if (lowerName.includes('certificate')) iconName = 'file-certificate';
      else if (lowerName.includes('farmer') || lowerName.includes('land')) iconName = 'sprout';

      return {
        id: `${record.schemeId}-doc-${idx}`,
        name: docName,
        iconName,
        status: uploaded ? 'verified' : 'missing',
        description: `Official ${docName} verification document`
      };
    });

    const totalDocs = resolvedRequiredDocs.length;
    const uploadedDocs = resolvedRequiredDocs.filter(d => d.status === 'verified').length;
    
    // ─── 8. Weighted Recommendation Match Score ──────────────────────────────
    // Demographic Weights (must sum to 100):
    // - Age Match        (25%)
    // - Gender Match     (15%)
    // - Income Match     (10%)
    // - State Match      (15%)
    // - Occupation Match (25%)
    // - Education Match  (10%)
    const ageWeight = 25;
    const genderWeight = 15;
    const incomeWeight = 10;
    const stateWeight = 15;
    const occupationWeight = 25;
    const educationWeight = 10;

    let score = 0;
    if (agePassed) score += ageWeight;
    if (genderPassed) score += genderWeight;
    if (incomePassed) score += incomeWeight;
    if (statePassed) score += stateWeight;
    if (occupationPassed) score += occupationWeight;
    if (educationPassed) score += educationWeight;

    // Additional boosters (e.g. Priority groups)
    let booster = 0;
    const userOccLower = (user.occupation || '').toLowerCase();
    
    if (record.farmerEligible && (userOccLower.includes('farmer') || userOccLower.includes('agri'))) booster += 5;
    if (record.studentEligible && (userOccLower.includes('student') || userOccLower.includes('school') || userOccLower.includes('college'))) booster += 5;
    if (record.seniorCitizenEligible && userAge !== null && userAge >= 60) booster += 5;
    if (record.disabledEligible && userDocs.some(d => (d.title || '').toLowerCase().includes('disability'))) booster += 8;

    const finalScore = Math.min(100, Math.round(score + booster));

    // ─── 9. Match Eligibility Status (independent of document checklist) ──────
    let eligibilityStatus: EligibilityStatus = 'not_eligible';
    if (finalScore >= 85) {
      eligibilityStatus = 'highly_recommended'; // Likely Eligible
    } else if (finalScore >= 60) {
      eligibilityStatus = 'eligible';           // Potential Match
    } else if (finalScore >= 30) {
      eligibilityStatus = 'partially_eligible'; // Partial Match
    } else {
      eligibilityStatus = 'not_eligible';       // Unlikely Match
    }

    // ─── 10. Assemble UI Eligibility Criteria Array ───────────────────────────
    const eligibilityCriteria: EligibilityCriterion[] = [
      {
        id: `${record.schemeId}-age-check`,
        label: 'Age Eligibility',
        required: ageRange === 'All' ? 'Any Age' : `${ageRange} years`,
        userValue: userAge !== null ? `${userAge} years` : 'Not set',
        passed: agePassed,
        reason: agePassed ? undefined : ageReason
      },
      {
        id: `${record.schemeId}-gender-check`,
        label: 'Gender Target',
        required: reqGender === 'All' ? 'Any Gender' : reqGender,
        userValue: user.gender || 'Not set',
        passed: genderPassed,
        reason: genderPassed ? undefined : genderReason
      },
      {
        id: `${record.schemeId}-income-check`,
        label: 'Income Limit',
        required: reqIncome === 'All' ? 'No Limit' : `Slab ${reqIncome}`,
        userValue: user.annual_income || 'Not set',
        passed: incomePassed,
        reason: incomePassed ? undefined : incomeReason
      },
      {
        id: `${record.schemeId}-state-check`,
        label: 'State Residency',
        required: reqState === 'All' ? 'Any State' : reqState,
        userValue: user.state || 'Not set',
        passed: statePassed,
        reason: statePassed ? undefined : stateReason
      },
      {
        id: `${record.schemeId}-occupation-check`,
        label: 'Occupation Match',
        required: reqOccupation === 'Any' ? 'Any Occupation' : reqOccupation,
        userValue: user.occupation || 'Not set',
        passed: occupationPassed,
        reason: occupationPassed ? undefined : occupationReason
      },
      {
        id: `${record.schemeId}-education-check`,
        label: 'Education Criteria',
        required: reqEducation === 'Any' ? 'Any Education' : reqEducation,
        userValue: reqEducation === 'Any' ? 'Any' : (educationPassed ? reqEducation : 'Not verified'),
        passed: educationPassed,
        reason: educationPassed ? undefined : educationReason
      }
    ];

    // Build FAQ array
    const faqs: FAQ[] = [
      {
        id: `${record.schemeId}-faq-1`,
        question: `How do I apply for ${record.title}?`,
        answer: `You can apply directly online through the official portal link at: ${record.officialApplyLink}. Ensure you have your ${resolvedRequiredDocs.map(d => d.name).join(', ')} ready.`
      },
      {
        id: `${record.schemeId}-faq-2`,
        question: `Which ministry oversees the ${record.title}?`,
        answer: `This program is administered by the ${record.ministry}.`
      }
    ];

    // Pick card accent color based on category
    let accentColor = '#2196F3'; // blue default
    let iconName = 'shield-check-outline';
    const lowerCategory = record.category.toLowerCase();
    
    if (lowerCategory.includes('health')) {
      accentColor = '#4CAF50';
      iconName = 'hospital-box';
    } else if (lowerCategory.includes('pension') || lowerCategory.includes('senior')) {
      accentColor = '#607D8B';
      iconName = 'piggy-bank';
    } else if (lowerCategory.includes('women')) {
      accentColor = '#E91E63';
      iconName = 'human-female';
    } else if (lowerCategory.includes('student') || lowerCategory.includes('education') || lowerCategory.includes('scholarship')) {
      accentColor = '#FF9800';
      iconName = 'school';
    } else if (lowerCategory.includes('farmer') || lowerCategory.includes('agri')) {
      accentColor = '#8BC34A';
      iconName = 'sprout';
    } else if (lowerCategory.includes('housing')) {
      accentColor = '#3F51B5';
      iconName = 'home-city';
    } else if (lowerCategory.includes('skill') || lowerCategory.includes('employment')) {
      accentColor = '#9C27B0';
      iconName = 'briefcase';
    } else if (lowerCategory.includes('startup') || lowerCategory.includes('business')) {
      accentColor = '#00BCD4';
      iconName = 'rocket-launch';
    }

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
      eligibilityPercentage: finalScore,
      eligibilityStatus,
      eligibilityCriteria,
      requiredDocuments: resolvedRequiredDocs,
      recommendedDocuments: (record.recommendedDocuments || []).map((docName, idx) => ({
        id: `${record.schemeId}-rec-${idx}`,
        name: docName,
        iconName: 'file-document-outline',
        status: hasUserUploadedDocument(docName, userDocs) ? ('verified' as const) : ('optional' as const),
        description: `Recommended: ${docName}`
      })),
      faqs,
      accentColor,
      iconName,
      tags: record.tags,

      // Database fields mapping
      name: record.title,
      shortDescription: record.subtitle,
      fullDescription: record.description,
      subcategory: record.subtitle,
      targetAudience: record.targetAudience || 'Indian Citizens',
      minAge: record.minAge,
      maxAge: record.maxAge,
      gender: record.gender,
      incomeLimit: record.incomeLimit,
      occupation: record.occupation,
      studentEligible: record.studentEligible,
      farmerEligible: record.farmerEligible,
      seniorCitizenEligible: record.seniorCitizenEligible,
      disabledEligible: record.disabledEligible,
      documentsRequired: record.documentsRequired,
      officialWebsite: record.officialWebsite,
      officialApplyLink: record.officialApplyLink,
      launchYear: record.launchYear,
      applicationMode: record.applicationMode,
      status: record.status,

      // Sync metadata
      version: record.version ?? 1,
      contentHash: record.contentHash ?? '',
      sourceName: record.sourceName,
      sourceURL: record.sourceURL,
      verifiedBy: record.verifiedBy,
      verificationDate: record.verificationDate,
      lastUpdated: record.lastUpdated ?? record.lastVerifiedDate ?? '',
      officialNotification: record.officialNotification ?? record.officialNotificationPDF ?? ''
    };
  }
};
