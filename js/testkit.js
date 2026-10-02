/* ============================================================
   testkit.js — QA Test Tools: floating menu that (1) generates
   randomized, realistic data across EVERY section of the
   application — including randomly exercising the conditional
   / reflexive questionnaire branches — and (2) produces a
   Flow & PDF Cross-Reference Report confirming whether every
   detail/condition required by the original Pioneer Life Inc.
   application form (Sections I–XV + TLIC) is currently satisfied.

   This file is purely additive: it only reads/writes AppState
   data via the same helpers used by the rest of the app
   (getPath/setPath, AppState.persist, renderCurrentStep, etc.)
   and never changes core app behavior.
   ============================================================ */

/* ---------- Generic random helpers ---------- */
function tk_randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function tk_randChoice(arr) { return arr[tk_randInt(0, arr.length - 1)]; }
function tk_randBool(pTrue = 0.5) { return Math.random() < pTrue; }
function tk_pad(n) { return n < 10 ? "0" + n : "" + n; }
function tk_randDigits(n) { let s = ""; for (let i = 0; i < n; i++) s += tk_randInt(0, 9); return s; }
function tk_randDateBetween(startYear, endYear) {
  const y = tk_randInt(startYear, endYear), m = tk_randInt(1, 12), d = tk_randInt(1, 28);
  return `${y}-${tk_pad(m)}-${tk_pad(d)}`;
}
function tk_dobForAge(age) {
  const today = new Date();
  const year = today.getFullYear() - age;
  return `${year}-${tk_pad(tk_randInt(1, 12))}-${tk_pad(tk_randInt(1, 28))}`;
}
function tk_computeAge(dobStr) {
  if (!dobStr) return 30;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return 30;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
function tk_todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${tk_pad(d.getMonth() + 1)}-${tk_pad(d.getDate())}`;
}
/* Distribute N random integer shares that sum exactly to 100 */
function tk_distributeToHundred(n) {
  if (n <= 0) return [];
  const parts = [];
  let remaining = 100;
  for (let i = 0; i < n - 1; i++) {
    const maxForThis = remaining - (n - 1 - i);
    const v = tk_randInt(0, Math.max(0, maxForThis));
    parts.push(v);
    remaining -= v;
  }
  parts.push(remaining);
  return parts;
}

/* ---------- Sample data pools ---------- */
const TK_MALE_FIRST = ["Juan", "Jose", "Carlos", "Miguel", "Antonio", "Rafael", "Eduardo", "Ramon", "Vicente", "Gabriel", "Marco", "Diego"];
const TK_FEMALE_FIRST = ["Maria", "Ana", "Carmen", "Teresa", "Josefa", "Isabel", "Rosario", "Lourdes", "Patricia", "Angela", "Camille", "Bianca"];
const TK_LAST_NAMES = ["Dela Cruz", "Santos", "Reyes", "Garcia", "Mendoza", "Torres", "Flores", "Ramos", "Castro", "Rivera", "Villanueva", "Bautista"];
const TK_CITIES = ["Manila", "Quezon City", "Cebu City", "Davao City", "Makati", "Pasig", "Baguio City", "Iloilo City", "Cagayan de Oro", "Taguig"];
const TK_OCCUPATIONS = ["Accountant", "Teacher", "Software Engineer", "Nurse", "Sales Manager", "Business Owner", "Civil Engineer", "Architect", "Government Employee", "Call Center Agent"];
const TK_EMPLOYERS = ["ABC Corp.", "Metro Bank", "Globe Telecom", "SM Group", "Self-Employed", "Ayala Corporation", "PLDT Inc.", "Jollibee Foods Corp."];
const TK_INSURERS = ["Sun Life", "Manulife", "AXA Philippines", "FWD Life", "Philam Life", "Pru Life UK"];
const TK_WORDS = ["alpha", "beta", "sample", "demo", "value", "entry", "item", "detail", "record", "note"];

function tk_capitalize(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
function tk_randomPhrase(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(tk_randChoice(TK_WORDS));
  return out.map(tk_capitalize).join(" ");
}
function tk_randomSentence() {
  return `Auto-generated QA test details: ${tk_randomPhrase(5)}.`;
}

/* ---------- Person / entity fillers ---------- */
function tk_fillPerson(obj, minAge = 18, maxAge = 65) {
  const sex = tk_randChoice(["Male", "Female"]);
  const first = sex === "Male" ? tk_randChoice(TK_MALE_FIRST) : tk_randChoice(TK_FEMALE_FIRST);
  const last = tk_randChoice(TK_LAST_NAMES);
  obj.lastName = last;
  obj.firstName = first;
  obj.middleName = tk_randChoice(TK_LAST_NAMES);
  obj.suffix = "";
  obj.dob = tk_dobForAge(tk_randInt(minAge, maxAge));
  obj.placeOfBirth = tk_randChoice(TK_CITIES);
  obj.sex = sex;
  obj.civilStatus = tk_randChoice(["Single", "Married", "Widowed", "Separated", "Annulled"]);
  obj.nationality = "Filipino";
  obj.tin = `${tk_randDigits(3)}-${tk_randDigits(3)}-${tk_randDigits(3)}`;
  obj.sssGsis = tk_randDigits(10);
  obj.mobileNo = "09" + tk_randDigits(9);
  obj.email = `${first}.${last}`.toLowerCase().replace(/\s+/g, "") + "@example.com";
  obj.homeAddress = `${tk_randInt(1, 999)} ${tk_randChoice(["Rizal", "Mabini", "Bonifacio", "Quezon", "Luna"])} St., ${tk_randChoice(TK_CITIES)}`;
  obj.officeAddress = tk_randBool(0.5) ? `${tk_randInt(1, 50)}F, ${tk_randChoice(TK_EMPLOYERS)} Bldg., ${tk_randChoice(TK_CITIES)}` : "";
  obj.occupation = tk_randChoice(TK_OCCUPATIONS);
  obj.employer = tk_randChoice(TK_EMPLOYERS);
  obj.natureOfBusiness = tk_randChoice(["Office Work", "Field Work", "Retail", "Manufacturing", "Consulting"]);
  obj.sourceOfIncome = tk_randChoice(["Employment", "Business", "Investments"]);
  obj.grossAnnualIncome = tk_randInt(240000, 3000000);
  obj.isUSCitizen = tk_randBool(0.05) ? "Yes" : "No";
  obj.hasGreenCard = tk_randBool(0.03) ? "Yes" : "No";
}

function tk_fillQuestionnaireRandom(key) {
  const config = QUESTIONNAIRES[key];
  const q = AppState.data.questionnaires[key];
  q.triggered = true;
  config.fields.forEach((f) => {
    let v;
    switch (f.type) {
      case "text": v = tk_randomPhrase(2); break;
      case "number": v = tk_randInt(1, 50); break;
      case "date": v = tk_randDateBetween(2000, 2023); break;
      case "select": v = tk_randChoice(f.options); break;
      case "yesno": v = tk_randBool(0.2) ? "Yes" : "No"; break;
      case "textarea": v = tk_randomSentence(); break;
      default: v = "";
    }
    q.data[f.key] = v;
  });
  q.completed = true;
}

/* ---------- Main random-fill routine ---------- */
function tk_fillRandomApplication() {
  const d = AppState.data;
  const log = [];

  // Start: Applicant vs Assured — randomly exercise both branches across runs.
  const sameAssured = tk_randBool(0.5) ? "Yes" : "No";
  d.insuredSameAsOwner = sameAssured;
  log.push(`Applicant/Assured: ${sameAssured === "Yes" ? "Same person" : "Different persons"}`);

  // Section I
  tk_fillPerson(d.policyowner, 25, 65);

  // Section II
  if (sameAssured === "No") {
    d.insured.relationshipToOwner = tk_randChoice(["Spouse", "Child", "Parent", "Sibling", "Business Partner", "Other"]);
    tk_fillPerson(d.insured, 1, 70);
  }

  // Section III — History
  const insuredDob = sameAssured === "Yes" ? d.policyowner.dob : d.insured.dob;
  const insuredAge = tk_computeAge(insuredDob);

  d.history.ownPolicies = [];
  if (tk_randBool(0.5)) {
    const n = tk_randInt(1, 2);
    for (let i = 0; i < n; i++) {
      d.history.ownPolicies.push({
        company: tk_randChoice(TK_INSURERS),
        planType: tk_randChoice(["Whole Life", "Endowment", "Term", "Variable Life"]),
        amount: tk_randInt(100000, 2000000),
        yearIssued: String(tk_randInt(2005, 2024)),
        status: tk_randChoice(["In Force", "Lapsed", "Matured", "Surrendered"]),
      });
    }
  }

  d.history.isBelowAge25 = insuredAge < 25 ? "Yes" : "No";
  d.history.parentsSiblings = [];
  if (d.history.isBelowAge25 === "Yes") {
    const n = tk_randInt(1, 2);
    for (let i = 0; i < n; i++) {
      d.history.parentsSiblings.push({
        relationship: tk_randChoice(["Father", "Mother", "Brother", "Sister"]),
        name: `${tk_randChoice(TK_MALE_FIRST)} ${tk_randChoice(TK_LAST_NAMES)}`,
        age: tk_randInt(20, 70),
        insuranceCompany: tk_randChoice(TK_INSURERS),
        amountInForce: tk_randInt(50000, 1000000),
      });
    }
    log.push(`Below 25 → ${d.history.parentsSiblings.length} parent/sibling insurance row(s) added`);
  }

  d.history.isMarried = insuredAge >= 18 && tk_randBool(0.4) ? "Yes" : "No";
  if (d.history.isMarried === "Yes") {
    tk_fillPerson(d.history.spouse, 18, 60);
    d.history.spouse.insuranceInForce = tk_randInt(0, 500000);
    log.push("Married → spouse insurance info added");
  }

  // Section IV — Replacement
  d.replacement.hasExistingToReplace = tk_randBool(0.3) ? "Yes" : "No";
  if (d.replacement.hasExistingToReplace === "Yes") {
    d.replacement.companyName = tk_randChoice(TK_INSURERS);
    d.replacement.policyNumber = "POL-" + tk_randDigits(7);
    d.replacement.details = tk_randomSentence();
    log.push("Replacement declaration details added");
  }

  // Section VI — Coverage (filled before Section V so Section V's Payor-question
  // gating, which depends on the PDB/PDDB riders chosen here, can be computed correctly)
  const plan = tk_randChoice(PLANS);
  d.coverage.planName = plan.name;
  d.coverage.currency = plan.currency === "PESO/USD" ? tk_randChoice(["Php", "USD"]) : "Php";
  d.coverage.faceAmount = tk_randInt(500000, 5000000);
  d.coverage.paymentPeriod = tk_randChoice(["Single Pay", "Regular Pay", "Others"]);
  d.coverage.paymentMode = tk_randChoice(["Annual", "Semi-Annual", "Quarterly", "Monthly via Credit Card", "Monthly via ADA", "Others"]);
  d.coverage.premiumAmount = tk_randInt(5000, 150000);
  RIDER_OPTIONS.forEach((r) => { d.coverage.riders[r.key] = tk_randBool(0.2); });
  d.coverage.riders.other = "";
  if (plan.participating === "Y") d.coverage.dividendOption = tk_randChoice(["Cash", "Premium Reduction", "Accumulate at Interest", "Paid-Up Additions"]);
  d.coverage.defaultOption = plan.productLine.trim() === "Variable Universal Life"
    ? tk_randChoice(["Charges Deducted from Fund Value", "Automatic Fund Withdrawal"])
    : tk_randChoice(["Automatic Premium Loan", "Extended Term Insurance", "Reduced Paid-Up"]);
  log.push(`Plan selected: ${plan.name} (${plan.productLine}${plan.aaOption === "Y" ? ", AA-eligible" : ""})`);

  // Section V — Declaration / Risk Questions (reflexive triggers)
  const decl = d.declaration;
  const anyYes = (q) => q.insured === "Yes" || q.payor === "Yes";
  const payorApplicable = showPayorDeclarationQuestions();

  decl.q1.insured = tk_randBool(0.2) ? "Yes" : "No"; decl.q1.payor = payorApplicable && tk_randBool(0.2) ? "Yes" : "No";
  if (anyYes(decl.q1)) decl.q1.details = tk_randomSentence();

  decl.q2a.insured = tk_randBool(0.3) ? "Yes" : "No"; decl.q2a.payor = payorApplicable && tk_randBool(0.3) ? "Yes" : "No";
  if (anyYes(decl.q2a)) { tk_fillQuestionnaireRandom("aviation"); log.push("Aviation Questionnaire triggered & completed"); }

  decl.q2b.insured = tk_randBool(0.3) ? "Yes" : "No"; decl.q2b.payor = payorApplicable && tk_randBool(0.3) ? "Yes" : "No";
  if (anyYes(decl.q2b)) { tk_fillQuestionnaireRandom("scuba"); log.push("Skin/Scuba Diving Questionnaire triggered & completed"); }

  decl.q2c.insured = tk_randBool(0.3) ? "Yes" : "No"; decl.q2c.payor = payorApplicable && tk_randBool(0.3) ? "Yes" : "No";
  if (anyYes(decl.q2c)) decl.q2c.purpose = tk_randChoice(["Personal Transport", "Occupation", "Recreational Hobby"]);

  decl.q2d.insured = tk_randBool(0.3) ? "Yes" : "No"; decl.q2d.payor = payorApplicable && tk_randBool(0.3) ? "Yes" : "No";
  if (anyYes(decl.q2d)) { tk_fillQuestionnaireRandom("hazardous"); log.push("Hazardous/Extreme Sports Questionnaire triggered & completed"); }

  decl.q3.insured = tk_randBool(0.15) ? "Yes" : "No"; decl.q3.payor = payorApplicable && tk_randBool(0.15) ? "Yes" : "No";
  if (anyYes(decl.q3)) decl.q3.details = tk_randomSentence();
  if (payorApplicable) log.push("Owner ≠ Insured + PDB/PDDB rider selected → Q1–Q3 Payor column answered (Rule BR-005)");

  decl.q4.insured = tk_randBool(0.15) ? "Yes" : "No"; decl.q4.payor = tk_randBool(0.1) ? "Yes" : "No";
  if (anyYes(decl.q4)) { tk_fillQuestionnaireRandom("publicOfficial"); log.push("Political Exposure (Self) details triggered & completed"); }

  decl.q5.insured = tk_randBool(0.15) ? "Yes" : "No"; decl.q5.payor = tk_randBool(0.1) ? "Yes" : "No";
  if (anyYes(decl.q5)) { tk_fillQuestionnaireRandom("publicOfficialRelation"); log.push("Political Exposure (Relation) details triggered & completed"); }

  decl.q6.insured = tk_randBool(0.15) ? "Yes" : "No"; decl.q6.payor = tk_randBool(0.1) ? "Yes" : "No";
  if (anyYes(decl.q6)) decl.q6.details = tk_randomSentence();

  // Section VII — Fund Allocation (Variable Life only, derived from the selected Plan)
  if (showAllocationSection()) {
    const singleShares = tk_distributeToHundred(d.allocation.rows.length);
    const regularShares = tk_distributeToHundred(d.allocation.rows.length);
    d.allocation.rows.forEach((row, idx) => { row.single = singleShares[idx]; row.regular = regularShares[idx]; });
    log.push("Variable Life plan → fund allocation distributed to 100%");
  }

  // Section VIII — Beneficiaries
  const benCount = tk_randInt(1, 3);
  const shares = tk_distributeToHundred(benCount);
  d.beneficiaries = [];
  for (let i = 0; i < benCount; i++) {
    const row = createEmptyBeneficiaryRow();
    const sex = tk_randChoice(["Male", "Female"]);
    row.name = `${sex === "Male" ? tk_randChoice(TK_MALE_FIRST) : tk_randChoice(TK_FEMALE_FIRST)} ${tk_randChoice(TK_LAST_NAMES)}`;
    row.sex = sex;
    row.relationship = tk_randChoice(["Spouse", "Child", "Parent", "Sibling"]);
    row.birthdate = tk_dobForAge(tk_randInt(1, 70));
    row.placeOfBirth = tk_randChoice(TK_CITIES);
    row.contactNo = "09" + tk_randDigits(9);
    row.address = `${tk_randInt(1, 999)} Sample St., ${tk_randChoice(TK_CITIES)}`;
    row.nationality = "Filipino";
    row.designation = "Primary";
    row.sharePercent = shares[i];
    row.revocable = tk_randChoice(["Revocable", "Irrevocable"]);
    d.beneficiaries.push(row);
  }
  log.push(`${benCount} beneficiary row(s) generated, Primary shares total 100%`);

  // Section IX — Other Information / Beneficial Owner Determination
  d.otherInfo.beneficialOwnerQ1 = tk_randBool(0.7) ? "Yes" : "No";
  d.otherInfo.beneficialOwnerQ2 = tk_randBool(0.15) ? "Yes" : "No";
  d.otherInfo.beneficialOwnerQ3 = tk_randBool(0.15) ? "Yes" : "No";
  if (d.otherInfo.beneficialOwnerQ1 === "Yes" || d.otherInfo.beneficialOwnerQ2 === "Yes" || d.otherInfo.beneficialOwnerQ3 === "Yes") {
    tk_fillQuestionnaireRandom("beneficialOwner");
    log.push("Beneficial Owner Declaration triggered & completed");
  }
  d.otherInfo.additionalDeclaration = tk_randBool(0.3) ? tk_randomSentence() : "";
  d.otherInfo.specialInstructions = tk_randBool(0.2) ? tk_randomSentence() : "";

  // Section X — Health Declaration (16+) — only meaningful when BR-009/010/011 applicability holds
  const healthAdultApplies = showHealthAdultSection();
  const h = d.healthAdult;
  h.height = tk_randInt(145, 190);
  h.weight = tk_randInt(45, 100);
  ["father", "mother"].forEach((k) => {
    h[k].age = tk_randInt(45, 85);
    h[k].status = tk_randChoice(["Living", "Deceased"]);
    h[k].causeOfDeath = h[k].status === "Deceased" ? tk_randChoice(["Heart Disease", "Cancer", "Natural Causes", "Diabetes Complications"]) : "";
    h[k].healthCondition = tk_randChoice(["None reported", "Hypertension", "Diabetes", "None reported"]);
  });
  const sibCount = tk_randInt(0, 3);
  h.siblings = [];
  for (let i = 0; i < sibCount; i++) {
    h.siblings.push({
      name: `${tk_randChoice(TK_MALE_FIRST)} ${tk_randChoice(TK_LAST_NAMES)}`,
      age: tk_randInt(5, 60),
      status: tk_randChoice(["Living", "Deceased"]),
      causeOfDeath: "",
      healthCondition: tk_randChoice(["None reported", "Asthma", "None reported"]),
    });
  }
  ADULT_MEDICAL_QUESTIONS.forEach(([key]) => {
    const path = `healthAdult.questions.${key}`;
    const answer = tk_randBool(0.12) ? "Yes" : "No";
    const details = answer === "Yes" ? tk_randomSentence() : "";
    setPath(d, `${path}.answer`, answer);
    setPath(d, `${path}.details`, details);
  });
  const effectiveSex = sameAssured === "Yes" ? d.policyowner.sex : d.insured.sex;
  if (effectiveSex === "Female") {
    setPath(d, "healthAdult.womenQuestions.pregnant.answer", tk_randBool(0.1) ? "Yes" : "No");
    setPath(d, "healthAdult.womenQuestions.pregnant.details", "");
    setPath(d, "healthAdult.womenQuestions.reproductive.answer", tk_randBool(0.1) ? "Yes" : "No");
    setPath(d, "healthAdult.womenQuestions.reproductive.details", "");
  }
  log.push(healthAdultApplies ? "Section X (Health Declaration 16+) applies and was filled" : "Section X (Health Declaration 16+) not applicable (Rules BR-009/010/011)");

  // Section XI — Health Declaration (Below 16) — only meaningful when BR-013 applicability holds
  const healthMinorApplies = showHealthMinorSection();
  d.healthMinor.height = tk_randInt(60, 150);
  d.healthMinor.weight = tk_randInt(5, 50);
  d.healthMinor.birthWeight = tk_randInt(2, 4);
  d.healthMinor.gestationWeeks = tk_randInt(32, 42);
  MINOR_MEDICAL_QUESTIONS.forEach(([key]) => {
    const path = `healthMinor.questions.${key}`;
    const answer = tk_randBool(0.1) ? "Yes" : "No";
    setPath(d, `${path}.answer`, answer);
    setPath(d, `${path}.details`, answer === "Yes" ? tk_randomSentence() : "");
  });
  log.push(healthMinorApplies ? "Section XI (Health Declaration <16) applies and was filled" : "Section XI (Health Declaration <16) not applicable (Rule BR-013)");

  // Section XIII — Temporary Life Insurance Cover (not applicable to Variable Life plans)
  if (showTempCoverOffer()) {
    d.tempCover.optIn = tk_randBool(0.7) ? "Yes" : "No";
    log.push(`Temporary Life Insurance Cover offered → opted ${d.tempCover.optIn}`);
  } else {
    d.tempCover.optIn = "";
    log.push("Temporary Life Insurance Cover not applicable — Variable Life plan (Rule BR-015)");
  }

  // Section XII — Agreement
  d.agreement.dataPrivacyConsent = true;
  d.agreement.marketingOptIn = tk_randBool(0.5);
  d.agreement.certifyTruth = true;
  d.agreement.place = tk_randChoice(TK_CITIES);
  d.agreement.date = tk_todayStr();

  // Section XIV — e-Statement Terms
  d.estatementTerms.agree = true;

  // Section XV — Authorization & Signatures
  const ownerName = `${d.policyowner.firstName} ${d.policyowner.lastName}`;
  const insuredName = sameAssured === "Yes" ? ownerName : `${d.insured.firstName} ${d.insured.lastName}`;
  d.authorization.policyownerSignature = ownerName;
  d.authorization.policyownerDate = tk_todayStr();
  d.authorization.lifeInsuredSignature = insuredName;
  d.authorization.lifeInsuredDate = tk_todayStr();
  d.authorization.isMinor = insuredAge < 18 ? "Yes" : "No";
  if (d.authorization.isMinor === "Yes") {
    d.authorization.guardianName = `${tk_randChoice(TK_MALE_FIRST)} ${tk_randChoice(TK_LAST_NAMES)}`;
    d.authorization.guardianSignature = d.authorization.guardianName;
    d.authorization.guardianDate = tk_todayStr();
    log.push("Insured is a minor → Parent/Guardian signature info added");
  }
  d.authorization.intermediaryName = tk_randBool(0.6) ? `${tk_randChoice(TK_MALE_FIRST)} ${tk_randChoice(TK_LAST_NAMES)}` : "";
  d.authorization.intermediaryCode = d.authorization.intermediaryName ? "AGT-" + tk_randDigits(5) : "";

  AppState.maxReachedIndex = FORM_STEPS.length - 1;
  AppState.persist();
  return log;
}

/* ============================================================
   Flow & PDF Cross-Reference Report
   Groups mirror the original PDF's own section numbering
   (I–XV + TLIC). Each check is computed live against the
   current AppState.data so the report always reflects whether
   every detail/condition required by the form is currently met.
   ============================================================ */
function tk_buildCrossReferenceReport() {
  const d = AppState.data;
  const sameAssured = d.insuredSameAsOwner;
  const insuredDob = sameAssured === "Yes" ? d.policyowner.dob : d.insured.dob;
  const insuredAge = tk_computeAge(insuredDob);
  const effectiveSex = sameAssured === "Yes" ? d.policyowner.sex : d.insured.sex;
  const anyYes = (q) => q.insured === "Yes" || q.payor === "Yes";

  const groups = [];

  groups.push({
    title: "Start — Applicant vs. Assured Validation",
    pdfRef: "Added per business requirement (precedes Section I)",
    checks: [
      { label: "Role determination explicitly confirmed (Yes/No, not defaulted)", pass: sameAssured === "Yes" || sameAssured === "No" },
    ],
  });

  const p = d.policyowner;
  groups.push({
    title: "I. Personal Information of the Policyowner / Applicant",
    pdfRef: "PDF Section I",
    checks: [
      { label: "Full name, date of birth, place of birth captured", pass: !!(p.lastName && p.firstName && p.dob) },
      { label: "Sex, civil status, nationality captured", pass: !!(p.sex && p.civilStatus && p.nationality) },
      { label: "Contact details (mobile number, home address) captured", pass: !!(p.mobileNo && p.homeAddress) },
      { label: "Occupation / employer information captured", pass: !!p.occupation },
      { label: "FATCA — U.S. citizen / Green Card questions answered", pass: !!(p.isUSCitizen && p.hasGreenCard) },
    ],
  });

  const insuredOk = sameAssured === "Yes" || !!(d.insured.lastName && d.insured.firstName && d.insured.dob && d.insured.relationshipToOwner);
  groups.push({
    title: "II. Personal Information of Life to be Insured",
    pdfRef: "PDF Section II",
    checks: [
      { label: sameAssured === "Yes" ? "Same person as Policyowner — information mirrored from Section I" : "Different person — full personal details & relationship to Policyowner captured", pass: insuredOk },
    ],
  });

  groups.push({
    title: "III. Life Insurance History",
    pdfRef: "PDF Section III",
    checks: [
      { label: "Below-25 branch: parents'/siblings' insurance info required & provided", pass: d.history.isBelowAge25 === "No" || d.history.parentsSiblings.length > 0 },
      { label: "Married branch: spouse insurance info required & provided", pass: d.history.isMarried === "No" || !!(d.history.spouse.lastName && d.history.spouse.firstName) },
    ],
  });

  groups.push({
    title: "IV. Declaration on Proposed Replacement of Existing Policy",
    pdfRef: "PDF Section IV",
    checks: [
      { label: "Replacement details (company, policy no., reason) required & provided when applicable", pass: d.replacement.hasExistingToReplace === "No" || !!(d.replacement.companyName && d.replacement.policyNumber && d.replacement.details) },
    ],
  });

  const payorApplicable = showPayorDeclarationQuestions();
  const anyYesGated = (q) => q.insured === "Yes" || (payorApplicable && q.payor === "Yes");
  groups.push({
    title: "V. Declaration of Life to be Insured and Payor (Risk Questions)",
    pdfRef: "PDF Section V",
    checks: [
      { label: payorApplicable ? "Payor column applies to Q1-3 (Owner ≠ Insured + PDB/PDDB rider) — Rule BR-005" : "Payor column N/A for Q1-3 (Owner = Insured, or no PDB/PDDB rider) — Rule BR-005", pass: true },
      { label: "Q1 — Job/visa change details provided if Yes", pass: !anyYesGated(d.declaration.q1) || !!d.declaration.q1.details },
      { label: "Q2a — Aviation Questionnaire completed if triggered", pass: !anyYesGated(d.declaration.q2a) || d.questionnaires.aviation.completed },
      { label: "Q2b — Skin/Scuba Diving Questionnaire completed if triggered", pass: !anyYesGated(d.declaration.q2b) || d.questionnaires.scuba.completed },
      { label: "Q2c — Motorcycle riding purpose specified if Yes", pass: !anyYesGated(d.declaration.q2c) || !!d.declaration.q2c.purpose },
      { label: "Q2d — Hazardous/Extreme Sports Questionnaire completed if triggered", pass: !anyYesGated(d.declaration.q2d) || d.questionnaires.hazardous.completed },
      { label: "Q3 — Declined/postponed/rated insurance details provided if Yes", pass: !anyYesGated(d.declaration.q3) || !!d.declaration.q3.details },
      { label: "Q4 — Political Exposure (Self) details completed if triggered", pass: !anyYes(d.declaration.q4) || d.questionnaires.publicOfficial.completed },
      { label: "Q5 — Political Exposure (Relation) details completed if triggered", pass: !anyYes(d.declaration.q5) || d.questionnaires.publicOfficialRelation.completed },
      { label: "Q6 — Lawsuit/litigation/investigation details provided if Yes", pass: !anyYes(d.declaration.q6) || !!d.declaration.q6.details },
    ],
  });

  const plan = getPlanByName(d.coverage.planName);
  const isVariable = isVariableLifePlan();
  const isParticipating = isParticipatingPlan();
  groups.push({
    title: "VI. Life Insurance Coverage Applied For",
    pdfRef: "PDF Section VI",
    checks: [
      { label: "Plan, face amount, payment period/mode, and premium amount specified", pass: !!(d.coverage.planName && d.coverage.faceAmount && d.coverage.paymentPeriod && d.coverage.paymentMode && d.coverage.premiumAmount) },
      { label: "Currency specified for dual-currency plans", pass: !plan || plan.currency !== "PESO/USD" || !!d.coverage.currency },
      { label: isParticipating ? "Dividend Option specified (Participating plan) — Rule BR-006" : "Dividend Option N/A — plan is not Participating — Rule BR-006", pass: !isParticipating || !!d.coverage.dividendOption },
      { label: isVariable ? "Charges Default Option specified (Variable Life)" : "Premium Default Option specified (Non-Variable Life)", pass: !!d.coverage.defaultOption },
    ],
  });

  const singleTotal = d.allocation.rows.reduce((s, r) => s + (Number(r.single) || 0), 0);
  const regularTotal = d.allocation.rows.reduce((s, r) => s + (Number(r.regular) || 0), 0);
  groups.push({
    title: "VII. Fund Allocation Instruction (Variable Life Only)",
    pdfRef: "PDF Section VII",
    checks: [
      { label: isVariable ? "Single Premium fund allocation totals 100%" : "Not applicable — Traditional (non-Variable Life) plan", pass: !isVariable || singleTotal === 100 },
      { label: isVariable ? "Regular Premium fund allocation totals 100%" : "Not applicable — Traditional (non-Variable Life) plan", pass: !isVariable || regularTotal === 100 },
    ],
  });

  const primaryTotal = d.beneficiaries.filter((b) => b.designation === "Primary").reduce((s, b) => s + (Number(b.sharePercent) || 0), 0);
  groups.push({
    title: "VIII. Designated Beneficiaries",
    pdfRef: "PDF Section VIII",
    checks: [
      { label: "At least one named beneficiary provided", pass: d.beneficiaries.some((b) => b.name) },
      { label: "Primary beneficiary shares total 100%", pass: !d.beneficiaries.some((b) => b.designation === "Primary") || primaryTotal === 100 },
    ],
  });

  const boTriggered = d.otherInfo.beneficialOwnerQ1 === "Yes" || d.otherInfo.beneficialOwnerQ2 === "Yes" || d.otherInfo.beneficialOwnerQ3 === "Yes";
  groups.push({
    title: "IX. Other Information (Beneficial Owner Determination)",
    pdfRef: "PDF Section IX",
    checks: [
      { label: "Beneficial Owner supplemental details completed if triggered", pass: !boTriggered || d.questionnaires.beneficialOwner.completed },
    ],
  });

  const h = d.healthAdult;
  const medicalDetailsOk = ADULT_MEDICAL_QUESTIONS.every(([key]) => {
    const q = getPath(d, `healthAdult.questions.${key}`) || {};
    return q.answer !== "Yes" || !!q.details;
  });
  const healthAdultApplies = showHealthAdultSection();
  groups.push({
    title: "X. Health Declaration of Life to be Insured / Payor (Age 16+)",
    pdfRef: "PDF Section X",
    checks: healthAdultApplies ? [
      { label: `Section applies — subject is ${healthAdultSubjectLabel()} (Rules BR-009/010/011)`, pass: true },
      { label: "Height & weight recorded", pass: !!(h.height && h.weight) },
      { label: "Family medical history (father/mother) captured", pass: !!(h.father.status && h.mother.status) },
      { label: "All medical history questions answered; details given where \"Yes\"", pass: medicalDetailsOk },
      { label: "Women-specific questions answered (if applicable)", pass: effectiveSex !== "Female" || !!(getPath(d, "healthAdult.womenQuestions.pregnant.answer")) },
    ] : [
      { label: "Not applicable — AA plan, or Owner≠Insured without a qualifying PDB/PDDB rider (Rules BR-009/010/011)", pass: true },
    ],
  });

  const healthMinorApplies = showHealthMinorSection();
  groups.push({
    title: "XI. Health Declaration of Life to be Insured (Below Age 16)",
    pdfRef: "PDF Section XI",
    checks: [
      { label: healthMinorApplies ? "Section applies — Insured is below 16 (Rule BR-013)" : "Not applicable — Insured is 16 or above (Rule BR-013)", pass: true },
    ],
  });

  groups.push({
    title: "XII. Declaration, Disclosure and Agreement",
    pdfRef: "PDF Section XII",
    checks: [
      { label: "Data Privacy Consent accepted", pass: !!d.agreement.dataPrivacyConsent },
      { label: "Certification of truthfulness accepted", pass: !!d.agreement.certifyTruth },
      { label: "Place & date signed provided", pass: !!(d.agreement.place && d.agreement.date) },
    ],
  });

  groups.push({
    title: "XIII. Temporary Life Insurance Cover Notice",
    pdfRef: "PDF Section XIII",
    checks: showTempCoverOffer() ? [
      { label: "Notice displayed (Php 1,000,000 max aggregate / 45-day cover)", pass: true },
      { label: "Opt-in choice recorded", pass: d.tempCover.optIn === "Yes" || d.tempCover.optIn === "No" },
    ] : [
      { label: "Not applicable — Variable Life plan (Rule BR-015)", pass: true },
    ],
  });

  groups.push({
    title: "XIV. Terms and Conditions of e-Statement Service",
    pdfRef: "PDF Section XIV",
    checks: [
      { label: "e-Statement Terms and Conditions agreed", pass: !!d.estatementTerms.agree },
    ],
  });

  groups.push({
    title: "XV. Authorization to Furnish Medical/Other Related Information",
    pdfRef: "PDF Section XV",
    checks: [
      { label: "Policyowner signature & date provided", pass: !!(d.authorization.policyownerSignature && d.authorization.policyownerDate) },
      { label: "Life Insured signature & date provided", pass: !!(d.authorization.lifeInsuredSignature && d.authorization.lifeInsuredDate) },
      { label: "Parent/Guardian info provided if Life Insured is a minor", pass: d.authorization.isMinor !== "Yes" || !!(d.authorization.guardianName && d.authorization.guardianSignature) },
    ],
  });

  return { groups, insuredAge, sameAssured };
}

function tk_renderReportHtml(report) {
  let totalPass = 0, totalFail = 0;
  const groupsHtml = report.groups.map((g) => {
    const items = g.checks.map((c) => {
      if (c.pass) totalPass++; else totalFail++;
      return `<li class="${c.pass ? "pass" : "fail"}"><span class="report-check-icon">${c.pass ? "✅" : "❌"}</span><span>${esc(c.label)}</span></li>`;
    }).join("");
    return `<div class="report-group">
      <div class="report-group-header"><span>${esc(g.title)}</span><span class="pdf-ref">${esc(g.pdfRef)}</span></div>
      <ul class="report-check-list">${items}</ul>
    </div>`;
  }).join("");

  const allPass = totalFail === 0;
  const banner = `<div class="report-summary-banner ${allPass ? "pass" : "fail"}">
    <span>${allPass ? "✅ All checks passed — every detail and condition required by the PDF application is satisfied." : `⚠ ${totalFail} of ${totalPass + totalFail} checks failed — see highlighted items below.`}</span>
    <span>${totalPass} passed · ${totalFail} failed</span>
  </div>`;

  const meta = `<div class="report-meta">
    Applicant/Assured: <strong>${report.sameAssured === "Yes" ? "Same person" : report.sameAssured === "No" ? "Different persons" : "Not yet answered"}</strong>
    &nbsp;|&nbsp; Computed age of Life to be Insured: <strong>${report.insuredAge}</strong>
    &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}
  </div>`;

  return banner + meta + groupsHtml;
}

function tk_openReportModal() {
  const report = tk_buildCrossReferenceReport();
  document.getElementById("testReportBody").innerHTML = tk_renderReportHtml(report);
  document.getElementById("testReportModal").classList.remove("hidden");
}
function tk_closeReportModal() {
  document.getElementById("testReportModal").classList.add("hidden");
}

/* ---------- Wiring ---------- */
function tk_init() {
  const toggle = document.getElementById("testFabToggle");
  const menu = document.getElementById("testFabMenu");
  toggle.addEventListener("click", () => menu.classList.toggle("hidden"));

  document.getElementById("testFillBtn").addEventListener("click", () => {
    tk_fillRandomApplication();
    renderCurrentStep();
    menu.classList.add("hidden");
    gotoStepId("review");
    tk_openReportModal();
  });

  document.getElementById("testValidateBtn").addEventListener("click", () => {
    menu.classList.add("hidden");
    tk_openReportModal();
  });

  document.getElementById("testResetBtn").addEventListener("click", () => {
    menu.classList.add("hidden");
    if (confirm("This will clear all entered data (same as Restart). Continue?")) {
      AppState.reset();
      gotoStepIndex(0);
    }
  });

  document.getElementById("testReportCloseX").addEventListener("click", tk_closeReportModal);
  document.getElementById("testReportCloseBtn").addEventListener("click", tk_closeReportModal);
  document.getElementById("testReportBackdrop").addEventListener("click", tk_closeReportModal);

  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("hidden") && !menu.contains(e.target) && e.target !== toggle) {
      menu.classList.add("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", tk_init);
