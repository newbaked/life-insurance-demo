/* ============================================================
   rules.js — Centralized business-rule helpers.
   Each function maps directly to a rule in the Business Rules
   Catalog (BR-xxx) from eApp_Business_Rules_Matrix.xlsx so that
   visibility/required logic used across sections.js, validate.js,
   printview.js, and testkit.js stays consistent and traceable.
   ============================================================ */

/* Current plan object (or null if none selected yet). */
function currentPlan() {
  return getPlanByName(val("coverage.planName"));
}

/* BR-007 / BR-014 / BR-015: Variable Life is derived from the
   selected plan's Product Line, not asked as a standalone question. */
function isVariableLifePlan() {
  const plan = currentPlan();
  if (!plan) return val("isVariableLife") === "Yes"; // fallback for legacy saved data
  return plan.productLine.trim() === "Variable Universal Life";
}

/* BR-006: Dividend Option (Section VI, Q7) applies only to Participating plans. */
function isParticipatingPlan() {
  const plan = currentPlan();
  return !!plan && plan.participating === "Y";
}

/* BR-009: Automatic Acceptance plans skip the Health Declaration (16+) entirely. */
function planHasAutomaticAcceptance() {
  const plan = currentPlan();
  return !!plan && plan.aaOption === "Y";
}

/* Owner vs. Insured helper (BR-002 and onward). */
function ownerIsInsured() {
  return val("insuredSameAsOwner") === "Yes";
}

/* BR-005 / BR-010 / BR-011: PDB/PDDB riders shift several declarations
   from the Life to be Insured onto the Payor. */
function hasPayorRider() {
  return !!(val("coverage.riders.pdb") || val("coverage.riders.pddb"));
}

/* BR-005: Section V Q1-3 (occupation/hazards, visa/travel, declined-insurance)
   are shown & required for the Payor only when Owner != Insured AND a
   PDB/PDDB rider is selected. Otherwise only Q4-6 apply. */
function showPayorDeclarationQuestions() {
  return !ownerIsInsured() && hasPayorRider();
}

/* Computes age in years from a yyyy-mm-dd date string; null if invalid/blank. */
function computeAge(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

/* Age of the Life to be Insured, regardless of whether they are the Owner. */
function getInsuredAge() {
  const dob = ownerIsInsured() ? val("policyowner.dob") : val("insured.dob");
  return computeAge(dob);
}

/* BR-009/010/011: Section X (Health Declaration, Age 16+) applies when:
   - the plan is NOT Automatic Acceptance, AND
   - Owner = Insured (declaration is about the Insured), OR
   - Owner != Insured AND Insured Age >= 16 AND a PDB/PDDB rider is selected
     (declaration subject becomes the Payor). */
function showHealthAdultSection() {
  if (planHasAutomaticAcceptance()) return false;
  if (ownerIsInsured()) return true;
  const age = getInsuredAge();
  return age != null && age >= 16 && hasPayorRider();
}

/* Who the Health Declaration (16+) is being answered about/by, for section labeling. */
function healthAdultSubjectLabel() {
  return ownerIsInsured() ? "Life to be Insured" : "Payor";
}

/* BR-013: Section XI (Health Declaration, Under 16) applies only when the
   Life to be Insured's computed age is below 16. If DOB is not yet known,
   default to showing it so nothing required is missed. */
function showHealthMinorSection() {
  const age = getInsuredAge();
  return age == null || age < 16;
}

/* BR-007: Section VII (Fund Allocation) applies only to Variable Life plans. */
function showAllocationSection() {
  return isVariableLifePlan();
}

/* BR-015: Temporary Life Insurance Cover (Section XIII / TLIC) does not
   apply to Variable Life plans. */
function showTempCoverOffer() {
  return !isVariableLifePlan();
}

/* BR-016/017: Minor status is derived from the Life to be Insured's computed
   age (not re-asked), so it can never contradict the DOB entered earlier.
   Returns true/false when the age is known, or null when DOB is not yet
   available (the UI falls back to asking directly in that case only). */
function isInsuredMinor() {
  const age = getInsuredAge();
  return age == null ? null : age < 18;
}
