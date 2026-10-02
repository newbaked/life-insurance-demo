/* ============================================================
   data.js — Static configuration: wizard steps & questionnaire
   definitions, derived directly from the Pioneer Life Inc.
   "Application Form for Life Insurance" (indlifeapp_2025).
   ============================================================ */

const FORM_STEPS = [
  { id: "start",          label: "Start: Applicant & Assured" },
  { id: "policyowner",    label: "I. Policyowner / Applicant" },
  { id: "insured",        label: "II. Life to be Insured" },
  { id: "history",        label: "III. Life Insurance History" },
  { id: "replacement",    label: "IV. Replacement Declaration" },
  { id: "declaration",    label: "V. Declaration & Risk Questions" },
  { id: "coverage",       label: "VI. Coverage Applied For" },
  { id: "allocation",     label: "VII. Fund Allocation" },
  { id: "beneficiaries",  label: "VIII. Designated Beneficiaries" },
  { id: "otherinfo",      label: "IX. Other Information" },
  { id: "healthadult",    label: "X. Health Declaration (16+)" },
  { id: "healthminor",    label: "XI. Health Declaration (Below 16)" },
  { id: "agreement",      label: "XII. Declaration & Agreement" },
  { id: "tempcover",      label: "XIII. Temporary Cover Notice" },
  { id: "estatement",     label: "XIV. e-Statement Terms" },
  { id: "authorization",  label: "XV. Authorization & Signatures" },
  { id: "review",         label: "Review & Submit" },
];

/* Each questionnaire: id, title, intro, fields[], and a function
   describing which trigger(s) activate it. completed-state lives
   in state.questionnaires[id] = { triggered, completed, data } */
const QUESTIONNAIRES = {
  aviation: {
    title: "Aviation Questionnaire",
    intro: "Required because you answered \"Yes\" to flying an aircraft other than as a fare-paying passenger. Please provide full details of your aviation activity.",
    fields: [
      { key: "capacity", label: "Capacity (Pilot, Student Pilot, Crew, etc.)", type: "text", required: true },
      { key: "licenseType", label: "Type of License Held", type: "text", required: true },
      { key: "aircraftType", label: "Type of Aircraft Flown", type: "text", required: true },
      { key: "totalHours", label: "Total Flying Hours to Date", type: "number", required: true },
      { key: "hoursLast12", label: "Flying Hours in Last 12 Months", type: "number", required: true },
      { key: "purpose", label: "Purpose of Flying", type: "select", required: true,
        options: ["Military", "Commercial", "Private/Personal", "Student Training", "Other"] },
      { key: "employer", label: "Employer / Flying Organization", type: "text" },
      { key: "futurePlans", label: "Any planned flying activities in the next 12 months?", type: "textarea" },
    ],
  },
  scuba: {
    title: "Skin / Scuba Diving Questionnaire",
    intro: "Required because you answered \"Yes\" to engaging in skin or scuba diving. Please provide full details of your diving activity.",
    fields: [
      { key: "certLevel", label: "Certification Level (e.g., Open Water, Advanced, Instructor)", type: "text", required: true },
      { key: "certBody", label: "Certifying Organization (e.g., PADI, SSI)", type: "text" },
      { key: "yearsActive", label: "Number of Years Diving", type: "number", required: true },
      { key: "maxDepth", label: "Maximum Depth Reached (meters/feet)", type: "text", required: true },
      { key: "diveFrequency", label: "Average Number of Dives per Year", type: "number", required: true },
      { key: "diveType", label: "Type of Diving", type: "select", required: true,
        options: ["Recreational", "Commercial", "Cave Diving", "Wreck Diving", "Competitive/Freediving", "Other"] },
      { key: "soloDiving", label: "Do you dive solo (without a buddy/instructor)?", type: "yesno" },
      { key: "futurePlans", label: "Any planned diving activities in the next 12 months?", type: "textarea" },
    ],
  },
  hazardous: {
    title: "Hazardous / Extreme Sports Questionnaire",
    intro: "Required because you answered \"Yes\" to participating in other hazardous sports or activities (e.g., mountain climbing, motor racing, bungee jumping, skydiving). Please provide full details.",
    fields: [
      { key: "activity", label: "Name of Sport / Activity", type: "text", required: true },
      { key: "experienceLevel", label: "Experience Level", type: "select", required: true,
        options: ["Beginner", "Intermediate", "Advanced", "Professional/Competitive"] },
      { key: "yearsActive", label: "Number of Years Involved", type: "number", required: true },
      { key: "frequency", label: "Frequency of Participation", type: "select", required: true,
        options: ["Few times a year", "Monthly", "Weekly", "Multiple times a week"] },
      { key: "club", label: "Club / Organization Affiliation (if any)", type: "text" },
      { key: "incidents", label: "Any prior accidents/injuries from this activity?", type: "yesno" },
      { key: "incidentDetails", label: "If yes, please describe", type: "textarea" },
      { key: "futurePlans", label: "Any planned events/competitions in the next 12 months?", type: "textarea" },
    ],
  },
  beneficialOwner: {
    title: "Beneficial Owner Declaration — Supplemental Details",
    intro: "Because you answered \"Yes\" to one of the beneficial-owner determination questions, please identify the beneficial owner/controlling party in full.",
    fields: [
      { key: "fullName", label: "Full Name of Beneficial Owner", type: "text", required: true },
      { key: "relationship", label: "Relationship to Policyowner", type: "text", required: true },
      { key: "dob", label: "Date of Birth", type: "date" },
      { key: "nationality", label: "Nationality", type: "text", required: true },
      { key: "idType", label: "Government ID Type", type: "text" },
      { key: "idNumber", label: "Government ID Number", type: "text" },
      { key: "address", label: "Complete Address", type: "textarea", required: true },
      { key: "sourceOfFunds", label: "Source of Funds / Nature of Relationship", type: "textarea", required: true },
    ],
  },
  publicOfficial: {
    title: "Political Exposure Details — Self (Public Official)",
    intro: "Because you answered \"Yes\" to being a present/former government official or candidate, please provide the details below.",
    fields: [
      { key: "position", label: "Position / Office Held", type: "text", required: true },
      { key: "office", label: "Office / Agency / Country", type: "text", required: true },
      { key: "dateFrom", label: "Date From", type: "date", required: true },
      { key: "dateTo", label: "Date To (leave blank if current)", type: "date" },
      { key: "country", label: "Country", type: "text", required: true },
    ],
  },
  publicOfficialRelation: {
    title: "Political Exposure Details — Close Relation",
    intro: "Because you answered \"Yes\" to having a close relationship with a government official, please provide the details below.",
    fields: [
      { key: "name", label: "Name of the Official", type: "text", required: true },
      { key: "relationship", label: "Relationship to You", type: "text", required: true },
      { key: "position", label: "Position / Office Held", type: "text", required: true },
      { key: "office", label: "Office / Agency", type: "text" },
      { key: "dateFrom", label: "Date From", type: "date" },
      { key: "dateTo", label: "Date To (leave blank if current)", type: "date" },
      { key: "country", label: "Country", type: "text", required: true },
    ],
  },
};

/* ============================================================
   Plans catalog — sourced from eApp_Business_Rules_Matrix.xlsx
   ("Plans" sheet). Drives several business rules:
   - BR-007 / Section VII: Fund Allocation applies only when
     Product Line = "Variable Universal Life".
   - BR-006 / Section VI Q7: Dividend Option applies only when
     Participating = "Y".
   - BR-009 / Section X: Health Declaration (16+) is hidden when
     the plan's Automatic Acceptance (AA) Option = "Y".
   - BR-015 / Section XIII: Temporary Life Insurance Cover does
     not apply to Variable Life plans.
   NOTE: Plan/Product details were provided with limited
   information by the Business Analysis team email (per Sir
   Mike/Dante); premium rates, face-amount bands, and complete
   AA criteria still need confirmation with the Product
   Management Team. See eApp_Business_Rules_Mapping.md for the
   full list of open items.
   ============================================================ */
const PLANS = [
  { name: "ENHANCE",                productLine: "Variable Universal Life", aaOption: "N", currency: "PESO",     participating: "" },
  { name: "ELITE",                   productLine: "Variable Universal Life", aaOption: "Y", currency: "PESO/USD", participating: "" },
  { name: "EMBRACE",                 productLine: "Variable Universal Life", aaOption: "Y", currency: "PESO/USD", participating: "N" },
  { name: "POWERFUND",               productLine: "Variable Universal Life", aaOption: "N", currency: "PESO",     participating: "" },
  { name: "ELEVATE",                 productLine: "Traditional Life",        aaOption: "N", currency: "PESO",     participating: "" },
  { name: "LIFEBOOST",               productLine: "Traditional Life",        aaOption: "N", currency: "PESO",     participating: "N" },
  { name: "THRIVE65",                productLine: "Traditional Life",        aaOption: "N", currency: "PESO",     participating: "Y" },
  { name: "VANTAGE",                 productLine: "Traditional Life",        aaOption: "N", currency: "PESO",     participating: "" },
  { name: "NEXTGEN+",                productLine: "Traditional Life",        aaOption: "N", currency: "PESO",     participating: "" },
  { name: "INFINITY 5+",             productLine: "Traditional Life",        aaOption: "N", currency: "PESO",     participating: "" },
  { name: "LIFEFORWARD+",            productLine: "Traditional Life",        aaOption: "N", currency: "PESO",     participating: "" },
  { name: "LIFETIME PROTECT",        productLine: "Traditional Life",        aaOption: "Y", currency: "PESO",     participating: "" },
  { name: "INCOME SAVER",            productLine: "Traditional Life",        aaOption: "Y", currency: "PESO",     participating: "" },
  { name: "GOAL FUNDER",             productLine: "Traditional Life",        aaOption: "Y", currency: "PESO",     participating: "" },
  { name: "RETIREMENT FUND BUILDER", productLine: "Traditional Life",        aaOption: "Y", currency: "PESO",     participating: "" },
];

function getPlanByName(name) {
  return PLANS.find((p) => p.name === name) || null;
}

/* Full rider list per Section VI (6. Riders) of the PDF, in display order. */
const RIDER_OPTIONS = [
  { key: "wp", label: "Disability Waiver of Premium Benefit" },
  { key: "ciwp", label: "Critical Illness Waiver of Premium Benefit" },
  { key: "pdb", label: "Payor's Death Benefit (PDB)" },
  { key: "pddb", label: "Payor's Death and Disability Benefit (PDDB)" },
  { key: "adb", label: "Accidental Death Benefit" },
  { key: "addb", label: "Accidental Death and Dismemberment Benefit" },
  { key: "ci", label: "Critical Illness Benefit" },
  { key: "hib", label: "Hospital Income Benefit" },
  { key: "acib", label: "Accelerated Critical Illness Benefit" },
  { key: "termRider", label: "Term Rider" },
  { key: "atpd", label: "Accelerated Total and Permanent Disability Benefit" },
  { key: "policyFund", label: "Policy Fund" },
];

/* Medical history relative rows for Health Declaration sections */
const SIBLING_SLOTS = 5;
