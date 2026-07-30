"""
eligibility_engine.py — Deterministic backend rule engine for VaultGov Citizen portal.
Does not use LLMs. Computes structured eligibility metrics based on profile and documents.
"""

from dataclasses import dataclass, asdict
from datetime import date, datetime
from typing import Any, Dict, List, Optional
import time

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.scheme import Scheme
from app.models.document import Document
from app.services import document_service


# ─── Caching System ──────────────────────────────────────────────────────────

# Simple in-memory cache holding computed EvaluationResult lists per user.
# Format: { firebase_uid: { "timestamp": float, "results": List[Dict] } }
_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def get_cached_eligibility(firebase_uid: str) -> Optional[List[Dict[str, Any]]]:
    """Retrieve cached eligibility results if not expired."""
    entry = _CACHE.get(firebase_uid)
    if entry and (time.time() - entry["timestamp"]) < CACHE_TTL_SECONDS:
        return entry["results"]
    return None


def cache_eligibility(firebase_uid: str, results: List[Dict[str, Any]]) -> None:
    """Store eligibility results in cache."""
    _CACHE[firebase_uid] = {
        "timestamp": time.time(),
        "results": results
    }


def invalidate_eligibility_cache(firebase_uid: Optional[str] = None) -> None:
    """Invalidate cache for a specific user, or clear all if no uid provided."""
    if firebase_uid:
        _CACHE.pop(firebase_uid, None)
    else:
        _CACHE.clear()


# ─── Domain Models ────────────────────────────────────────────────────────────

@dataclass
class RuleResult:
    rule: str
    required: str
    actual: str
    passed: bool
    reason: str
    is_insufficient: bool = False


@dataclass
class EvaluationResult:
    scheme_id: str
    scheme_name: str
    status: str  # eligible | partially_eligible | not_eligible | insufficient_information
    confidence: int  # 0-100 score
    matched_rules: List[RuleResult]
    failed_rules: List[RuleResult]
    missing_information: List[str]
    missing_documents: List[str]
    recommendation: str
    next_steps: str


# ─── Helper Functions ─────────────────────────────────────────────────────────

def calculate_age(dob: Optional[date]) -> Optional[int]:
    """Calculate age based on DOB relative to a constant system date or today."""
    if not dob:
        return None
    # Use current system year of the simulation context
    ref = date(2026, 7, 18)
    age = ref.year - dob.year
    if (ref.month, ref.day) < (dob.month, dob.day):
        age -= 1
    return age


def get_document_type(name: str) -> str:
    """Normalizes a document string into a standard document_type."""
    if not name:
        return ""
    s = name.upper()
    if "AADHAAR" in s or "UIDAI" in s: return "AADHAAR_CARD"
    if "PAN" in s or "PERMANENT ACCOUNT" in s: return "PAN_CARD"
    if "DRIVING" in s or "DL" in s or "LICENCE" in s or "LICENSE" in s: return "DRIVING_LICENSE"
    if "VOTER" in s or "EPIC" in s or "ELECTION" in s: return "VOTER_ID"
    if "PASSPORT" in s: return "PASSPORT"
    if "RATION" in s: return "RATION_CARD"
    if "INCOME" in s: return "INCOME_CERTIFICATE"
    if "CASTE" in s or "COMMUNITY" in s: return "CASTE_CERTIFICATE"
    if "DOMICILE" in s or "RESIDENCE" in s or "ADDRESS" in s: return "DOMICILE_CERTIFICATE"
    if "BIRTH" in s: return "BIRTH_CERTIFICATE"
    if "MARKSHEET" in s or "DEGREE" in s or "EDUCATION" in s or "PASSING" in s: return "EDUCATION_CERTIFICATE"
    if "DISABILITY" in s or "DISABLED" in s: return "DISABILITY_CERTIFICATE"
    if "BANK" in s or "PASSBOOK" in s: return "BANK_PASSBOOK"
    if "FARMER" in s or "LAND" in s: return "FARMER_CERTIFICATE"
    return s.replace(" ", "_").strip()


def has_user_uploaded_document(required_doc_name: str, user_docs: List[Document]) -> bool:
    """Checks if a required document name matches any user uploaded document using document_type."""
    if not user_docs:
        return False
        
    req_type = get_document_type(required_doc_name)
    
    for doc in user_docs:
        if req_type == get_document_type(doc.title or ""):
            return True
            
        if req_type == get_document_type(doc.category or ""):
            return True
            
        for t in (doc.tags or []):
            if req_type == get_document_type(t):
                return True
                
    return False


# ─── Evaluators ───────────────────────────────────────────────────────────────

class AgeEvaluator:
    @staticmethod
    def evaluate(scheme: Scheme, user_age: Optional[int]) -> RuleResult:
        req = scheme.ageRange
        if not req or req.lower() in ("all", "any"):
            return RuleResult(
                rule="Age",
                required="All ages eligible",
                actual=str(user_age) if user_age is not None else "Not Set",
                passed=True,
                reason="Universal age eligibility."
            )
            
        if user_age is None:
            return RuleResult(
                rule="Age",
                required=req,
                actual="Not Set",
                passed=False,
                reason="Date of birth is not set in your profile.",
                is_insufficient=True
            )
            
        # Parse range (e.g. 18-60, 18-120)
        try:
            parts = req.split("-")
            min_age = int(parts[0])
            max_age = int(parts[1]) if len(parts) > 1 else 150
            if min_age <= user_age <= max_age:
                return RuleResult(
                    rule="Age",
                    required=req,
                    actual=f"{user_age} years",
                    passed=True,
                    reason=f"Age falls within the eligible range ({req})."
                )
            else:
                return RuleResult(
                    rule="Age",
                    required=req,
                    actual=f"{user_age} years",
                    passed=False,
                    reason=f"Age does not satisfy the requirements of this scheme ({req})."
                )
        except ValueError:
            # Fallback direct string match or check operator
            if req.startswith("<"):
                limit = int(req.replace("<", "").strip())
                passed = user_age < limit
            elif req.startswith(">"):
                limit = int(req.replace(">", "").strip())
                passed = user_age > limit
            else:
                passed = True
                
            return RuleResult(
                rule="Age",
                required=req,
                actual=f"{user_age} years",
                passed=passed,
                reason=f"Age verification returned {passed}."
            )


class IncomeEvaluator:
    SLAB_ORDER = {"EWS": 1, "LIG": 2, "MIG": 3, "HIG": 4}

    @classmethod
    def evaluate(cls, scheme: Scheme, user_income: Optional[str]) -> RuleResult:
        req = scheme.incomeLimit
        if not req or req.lower() in ("all", "any"):
            return RuleResult(
                rule="Income",
                required="No Limit",
                actual=user_income or "Not Set",
                passed=True,
                reason="Universal income eligibility."
            )
            
        if not user_income:
            return RuleResult(
                rule="Income",
                required=f"Slab {req}",
                actual="Not Set",
                passed=False,
                reason="Annual income is not set in your profile.",
                is_insufficient=True
            )
            
        u_slab = user_income.upper().strip()
        s_slab = req.upper().strip()
        
        user_val = cls.SLAB_ORDER.get(u_slab)
        req_val = cls.SLAB_ORDER.get(s_slab)
        
        if not user_val or not req_val:
            return RuleResult(
                rule="Income",
                required=req,
                actual=user_income,
                passed=True,
                reason="Income slabs could not be parsed but treated as eligible by default."
            )
            
        if user_val <= req_val:
            return RuleResult(
                rule="Income",
                required=f"Slab {req}",
                actual=user_income,
                passed=True,
                reason=f"Income slab {user_income} is within eligible limit ({req})."
            )
        else:
            return RuleResult(
                rule="Income",
                required=f"Slab {req}",
                actual=user_income,
                passed=False,
                reason=f"Income category ({user_income}) exceeds allowed limit for this scheme ({req})."
            )


class GenderEvaluator:
    @staticmethod
    def evaluate(scheme: Scheme, user_gender: Optional[str]) -> RuleResult:
        req = scheme.gender
        if not req or req.lower() in ("all", "any"):
            return RuleResult(
                rule="Gender",
                required="All",
                actual=user_gender or "Not Set",
                passed=True,
                reason="All genders are eligible."
            )
            
        if not user_gender:
            return RuleResult(
                rule="Gender",
                required=req,
                actual="Not Set",
                passed=False,
                reason="Gender is not set in your profile.",
                is_insufficient=True
            )
            
        if req.lower() == user_gender.lower():
            return RuleResult(
                rule="Gender",
                required=req,
                actual=user_gender,
                passed=True,
                reason="Gender satisfies eligibility."
            )
        else:
            return RuleResult(
                rule="Gender",
                required=req,
                actual=user_gender,
                passed=False,
                reason=f"This scheme is restricted to {req} applicants."
            )


class OccupationEvaluator:
    @staticmethod
    def evaluate(scheme: Scheme, user_occupation: Optional[str]) -> RuleResult:
        req = scheme.occupation
        if not req or req.lower() in ("any", "all"):
            return RuleResult(
                rule="Occupation",
                required="Any",
                actual=user_occupation or "Not Set",
                passed=True,
                reason="All occupations eligible."
            )
            
        if not user_occupation:
            return RuleResult(
                rule="Occupation",
                required=req,
                actual="Not Set",
                passed=False,
                reason="Occupation is not set in your profile.",
                is_insufficient=True
            )
            
        u_occ = user_occupation.lower().strip()
        r_occ = req.lower().strip()
        
        passed = False
        if r_occ == "farmer" and ("farmer" in u_occ or "agri" in u_occ):
            passed = True
        elif r_occ == "student" and any(k in u_occ for k in ["student", "school", "college", "academic"]):
            passed = True
        elif r_occ == "unorganized worker" and any(k in u_occ for k in ["unorganized", "worker", "labor", "shram"]):
            passed = True
        elif r_occ in ("entrepreneur", "business owner", "self-employed") and \
             any(k in u_occ for k in ["entrepreneur", "business", "owner", "startup", "self"]):
            passed = True
        elif r_occ in u_occ:
            passed = True
            
        if passed:
            return RuleResult(
                rule="Occupation",
                required=req,
                actual=user_occupation,
                passed=True,
                reason=f"Occupation matches eligible criteria ({req})."
            )
        else:
            return RuleResult(
                rule="Occupation",
                required=req,
                actual=user_occupation,
                passed=False,
                reason=f"Scheme targets different occupation profile ({req})."
            )


class LocationEvaluator:
    @staticmethod
    def evaluate(scheme: Scheme, user_state: Optional[str], user_district: Optional[str]) -> List[RuleResult]:
        results = []
        
        # State Evaluator
        req_state = scheme.state
        if not req_state or req_state.lower() in ("all", "any"):
            results.append(RuleResult(
                rule="State",
                required="All States",
                actual=user_state or "Not Set",
                passed=True,
                reason="Residency in any state is accepted."
            ))
        elif not user_state:
            results.append(RuleResult(
                rule="State",
                required=req_state,
                actual="Not Set",
                passed=False,
                reason="Residency state is not set in your profile.",
                is_insufficient=True
            ))
        elif req_state.lower() == user_state.lower():
            results.append(RuleResult(
                rule="State",
                required=req_state,
                actual=user_state,
                passed=True,
                reason="Resides in eligible state."
            ))
        else:
            results.append(RuleResult(
                rule="State",
                required=req_state,
                actual=user_state,
                passed=False,
                reason=f"Restricted to residents of {req_state}."
            ))
            
        # District Evaluator
        req_district = scheme.district
        if not req_district or req_district.lower() in ("all", "any"):
            pass  # No district criteria
        elif not user_district:
            results.append(RuleResult(
                rule="District",
                required=req_district,
                actual="Not Set",
                passed=False,
                reason="Residency district is not set in your profile.",
                is_insufficient=True
            ))
        elif req_district.lower() == user_district.lower():
            results.append(RuleResult(
                rule="District",
                required=req_district,
                actual=user_district,
                passed=True,
                reason="Resides in eligible district."
            ))
        else:
            results.append(RuleResult(
                rule="District",
                required=req_district,
                actual=user_district,
                passed=False,
                reason=f"Restricted to residents of {req_district}."
            ))
            
        return results


class EducationEvaluator:
    @staticmethod
    def evaluate(scheme: Scheme, user_education: Optional[str], user_docs: List[Document], user_age: Optional[int], user_occupation: Optional[str]) -> RuleResult:
        req = scheme.education or "Any"
        if not req or req.lower() in ("any", "all"):
            return RuleResult(
                rule="Education",
                required="Any",
                actual="Any",
                passed=True,
                reason="No specific educational criteria."
            )
            
        has_marksheet = any(
            any(k in (d.title or "").lower() for k in ["marksheet", "degree", "passing certificate", "diploma", "education"])
            for d in user_docs
        )
        
        is_grad = req.lower() == "graduate"
        is_sec = req.lower() == "secondary"
        
        passed = True
        reason = "Education requirements verified."
        
        if is_grad:
            has_degree_doc = any(
                any(k in (d.title or "").lower() for k in ["degree", "graduation", "convocation", "bachelor", "master"])
                for d in user_docs
            )
            has_grad_occ = (user_occupation or "").lower() in ["unorganized worker", "entrepreneur", "business owner", "self-employed", "professional", "officer", "manager"]
            if not has_degree_doc and not has_grad_occ:
                passed = False
                reason = "Requires a Graduate degree certificate."
        elif is_sec:
            if not has_marksheet and user_age is not None and user_age < 15:
                passed = False
                reason = "Requires secondary education documentation."
                
        return RuleResult(
            rule="Education",
            required=req,
            actual="Verified" if passed else "Not Verified",
            passed=passed,
            reason=reason
        )


class DocumentEvaluator:
    @staticmethod
    def evaluate(scheme: Scheme, user_docs: List[Document]) -> Dict[str, List[str]]:
        req_docs = scheme.requiredDocuments or []
        verified = []
        missing = []
        
        print(f"\n--- Document Evaluator: {scheme.title} ---")
        print(f"Required documents: {req_docs}")
        print(f"User uploaded documents: {[doc.title for doc in user_docs]}")
        
        for name in req_docs:
            if has_user_uploaded_document(name, user_docs):
                verified.append(name)
            else:
                missing.append(name)
                
        print(f"Missing documents: {missing}")
        print(f"Comparison result: Verified={verified}, Missing={missing}")
        print("-" * 45 + "\n")
        
        return {
            "verified": verified,
            "missing": missing
        }


# ─── Score & Recommendation Engines ──────────────────────────────────────────

class ScoreCalculator:
    @staticmethod
    def calculate(rule_results: List[RuleResult], scheme: Scheme, user_age: Optional[int], user_occupation: Optional[str], user_docs: List[Document]) -> int:
        # Weights: Age(25), Gender(15), Income(10), State(15), Occupation(25), Education(10)
        weights = {
            "Age": 25,
            "Gender": 15,
            "Income": 10,
            "State": 15,
            "Occupation": 25,
            "Education": 10
        }
        
        score = 0
        rule_map = {r.rule: r for r in rule_results}
        
        for rule, weight in weights.items():
            if rule in rule_map:
                if rule_map[rule].passed:
                    score += weight
            else:
                score += weight  # Satisfied by default (no constraint)
                
        # Boosters
        booster = 0
        occ = (user_occupation or "").lower()
        if getattr(scheme, "farmerEligible", False) and ("farmer" in occ or "agri" in occ):
            booster += 5
        if getattr(scheme, "studentEligible", False) and any(k in occ for k in ["student", "school", "college"]):
            booster += 5
        if getattr(scheme, "seniorCitizenEligible", False) and user_age is not None and user_age >= 60:
            booster += 5
        if getattr(scheme, "disabledEligible", False) and any("disability" in (d.title or "").lower() for d in user_docs):
            booster += 8
            
        return min(100, score + booster)


class RecommendationGenerator:
    @staticmethod
    def generate(
        missing_fields: List[str],
        missing_docs: List[str],
        status: str,
        scheme_name: str
    ) -> List[Dict[str, Any]]:
        recs = []
        
        # Priority 1: Missing critical demographic fields
        for field in missing_fields:
            recs.append({
                "priority": 1,
                "action": f"Provide your {field} in Profile Settings",
                "reason": f"Needed to accurately evaluate eligibility for {scheme_name}."
            })
            
        # Priority 2: Missing required documents
        for doc in missing_docs:
            recs.append({
                "priority": 2,
                "action": f"Upload {doc} to Digital Locker",
                "reason": f"A required document to apply for {scheme_name}."
            })
            
        # Priority 3: Actions for eligible or closing schemes
        if status == "eligible":
            recs.append({
                "priority": 3,
                "action": f"Apply now for {scheme_name}",
                "reason": "You satisfy all eligibility criteria and document requirements."
            })
            
        return sorted(recs, key=lambda x: x["priority"])


# ─── Main Eligibility Engine ──────────────────────────────────────────────────

class EligibilityEngine:
    @classmethod
    def analyze_profile_completion(cls, user: User) -> Dict[str, Any]:
        """Assess completion metrics of user profile."""
        fields = {
            "Date of Birth": user.date_of_birth,
            "Gender": user.gender,
            "State": user.state,
            "District": user.district,
            "Occupation": user.occupation,
            "Annual Income": user.annual_income,
        }
        critical_fields = ["Date of Birth", "State", "Annual Income", "Occupation", "Gender"]
        
        missing = [k for k, v in fields.items() if not v]
        critical = [k for k in critical_fields if not fields[k]]
        
        total_fields = len(fields) + 1  # include Full Name
        filled_fields = total_fields - len(missing) - (0 if user.full_name else 1)
        percentage = int((filled_fields / (total_fields)) * 100)
        
        return {
            "percentage": percentage,
            "missing": missing,
            "critical": critical
        }

    @classmethod
    def evaluate_scheme(
        cls,
        scheme: Scheme,
        user: User,
        user_docs: List[Document]
    ) -> EvaluationResult:
        """Run deterministically all evaluators for a single scheme."""
        age = calculate_age(user.date_of_birth)
        
        # 1. Run evaluators
        age_res = AgeEvaluator.evaluate(scheme, age)
        income_res = IncomeEvaluator.evaluate(scheme, user.annual_income)
        gender_res = GenderEvaluator.evaluate(scheme, user.gender)
        occ_res = OccupationEvaluator.evaluate(scheme, user.occupation)
        edu_res = EducationEvaluator.evaluate(scheme, getattr(scheme, "education", None), user_docs, age, user.occupation)
        
        loc_res_list = LocationEvaluator.evaluate(scheme, user.state, user.district)
        
        all_rule_results = [age_res, income_res, gender_res, occ_res, edu_res] + loc_res_list
        
        matched_rules = [r for r in all_rule_results if r.passed]
        failed_rules = [r for r in all_rule_results if not r.passed and not r.is_insufficient]
        insufficient_rules = [r for r in all_rule_results if r.is_insufficient]
        
        # 2. Document Evaluation
        doc_res = DocumentEvaluator.evaluate(scheme, user_docs)
        missing_docs = doc_res["missing"]
        
        # 3. Score calculation
        confidence = ScoreCalculator.calculate(all_rule_results, scheme, age, user.occupation, user_docs)
        
        # 4. Status determination
        missing_fields = [r.rule for r in insufficient_rules]
        
        if failed_rules:
            status = "not_eligible"
        elif insufficient_rules:
            status = "insufficient_information"
        elif missing_docs:
            status = "partially_eligible"
        else:
            status = "eligible"
            
        # 5. Recommendation & Next Steps
        recs = RecommendationGenerator.generate(missing_fields, missing_docs, status, scheme.title)
        
        rec_text = "Satisfies all eligibility requirements."
        if status == "insufficient_information":
            rec_text = f"Provide your missing profile information ({', '.join(missing_fields)}) to complete evaluation."
        elif status == "partially_eligible":
            rec_text = f"Upload required documents ({', '.join(missing_docs)}) to proceed."
        elif status == "not_eligible":
            failed_names = [f"{r.rule}: {r.reason}" for r in failed_rules]
            rec_text = f"Does not qualify due to mismatch in: {'; '.join(failed_names)}"
            
        next_steps = "Visit the scheme website to apply."
        if status == "eligible":
            next_steps = f"Apply directly at {scheme.officialApplyLink}"
            
        return EvaluationResult(
            scheme_id=scheme.schemeId,
            scheme_name=scheme.title,
            status=status,
            confidence=confidence,
            matched_rules=matched_rules,
            failed_rules=failed_rules,
            missing_information=missing_fields,
            missing_documents=missing_docs,
            recommendation=rec_text,
            next_steps=next_steps
        )

    @classmethod
    def evaluate_all(cls, db: Session, firebase_uid: str) -> Dict[str, Any]:
        """Batch evaluate all active schemes for the user with caching support."""
        # 1. Try Cache
        cached = get_cached_eligibility(firebase_uid)
        if cached:
            return cached
            
        # 2. Load User Profile and Documents
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            return {
                "eligible_schemes": [],
                "partially_eligible": [],
                "not_eligible": [],
                "insufficient_information": [],
                "missing_documents": [],
                "missing_profile_fields": [],
                "recommendations": [],
                "profile_completion": {"percentage": 0, "missing": [], "critical": []}
            }
            
        user_docs = document_service.get_documents(db, user.id)
        
        # 3. Load all active/valid schemes
        schemes = db.query(Scheme).filter(Scheme.status.in_(["Active", "Permanent", "Closing Soon"])).all()
        
        # 4. Evaluate each scheme
        eval_list: List[EvaluationResult] = []
        for s in schemes:
            eval_res = cls.evaluate_scheme(s, user, user_docs)
            eval_list.append(eval_res)
            
        # 5. Sorting (confidence DESC, applicationEnd ASC/DESC, name ASC)
        def sort_key(item: EvaluationResult):
            # parse deadline if possible
            deadline = 999999
            if item.next_steps:
                # Mock high order fallback
                deadline = 0
            return (-item.confidence, deadline, item.scheme_name)
            
        eval_list.sort(key=sort_key)
        
        # 6. Group categories
        eligible = []
        partially = []
        not_elig = []
        insufficient = []
        
        all_missing_docs = set()
        all_recs = []
        
        for item in eval_list:
            dict_rep = {
                "scheme_id": item.scheme_id,
                "scheme_name": item.scheme_name,
                "status": item.status,
                "confidence": item.confidence,
                "matched_rules": [asdict(r) for r in item.matched_rules],
                "failed_rules": [asdict(r) for r in item.failed_rules],
                "missing_information": item.missing_information,
                "missing_documents": item.missing_documents,
                "recommendation": item.recommendation,
                "next_steps": item.next_steps
            }
            
            if item.status == "eligible":
                eligible.append(dict_rep)
            elif item.status == "partially_eligible":
                partially.append(dict_rep)
                all_missing_docs.update(item.missing_documents)
            elif item.status == "insufficient_information":
                insufficient.append(dict_rep)
            else:
                not_elig.append(dict_rep)
                
            for rec in RecommendationGenerator.generate(item.missing_information, item.missing_documents, item.status, item.scheme_name):
                # Ensure priority recommendations are captured cleanly
                all_recs.append(rec)
                
        # Deduplicate and sort recommendations by priority
        unique_recs = {}
        for r in all_recs:
            unique_recs[r["action"]] = r
        sorted_recs = sorted(unique_recs.values(), key=lambda x: x["priority"])
        
        profile_metrics = cls.analyze_profile_completion(user)
        
        final_payload = {
            "eligible_schemes": eligible,
            "partially_eligible": partially,
            "not_eligible": not_elig,
            "insufficient_information": insufficient,
            "missing_documents": sorted(list(all_missing_docs)),
            "missing_profile_fields": profile_metrics["missing"],
            "recommendations": sorted_recs,
            "profile_completion": profile_metrics
        }
        
        # Cache Result
        cache_eligibility(firebase_uid, final_payload)
        return final_payload
