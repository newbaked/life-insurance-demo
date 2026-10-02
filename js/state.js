/* ============================================================
   state.js — Application state model + persistence (localStorage)
   ============================================================ */

const STORAGE_KEY = "pioneerLifeApplication_v1";

function createEmptyFamilyMember() {
  return { name: "", age: "", status: "Living", causeOfDeath: "", healthCondition: "" };
}

function createEmptyHistoryRow() {
  return { company: "", planType: "", amount: "", yearIssued: "", status: "" };
}

function createEmptyBeneficiaryRow() {
  return {
    name: "", sex: "", relationship: "", birthdate: "", placeOfBirth: "",
    contactNo: "", address: "", nationality: "", designation: "Primary",
    sharePercent: "", revocable: "Revocable",
  };
}

function getInitialState() {
  return {
    meta: { startedAt: new Date().toISOString(), version: 1 },

    policyowner: {
      lastName: "", firstName: "", middleName: "", suffix: "",
      dob: "", placeOfBirth: "", sex: "", civilStatus: "", nationality: "",
      tin: "", sssGsis: "",
      mobileNo: "", email: "", homeAddress: "", officeAddress: "",
      occupation: "", employer: "", natureOfBusiness: "", sourceOfIncome: "", grossAnnualIncome: "",
      isUSCitizen: "", hasGreenCard: "",
    },

    insuredSameAsOwner: "",
    insured: {
      lastName: "", firstName: "", middleName: "", suffix: "",
      dob: "", placeOfBirth: "", sex: "", civilStatus: "", nationality: "",
      tin: "", sssGsis: "",
      mobileNo: "", email: "", homeAddress: "", officeAddress: "",
      occupation: "", employer: "", natureOfBusiness: "", sourceOfIncome: "", grossAnnualIncome: "",
      relationshipToOwner: "", isUSCitizen: "", hasGreenCard: "",
    },

    history: {
      ownPolicies: [],
      isBelowAge25: "No",
      parentsSiblings: [],
      isMarried: "No",
      spouse: { lastName: "", firstName: "", middleName: "", dob: "", occupation: "", insuranceInForce: "" },
    },

    replacement: {
      hasExistingToReplace: "No",
      details: "",
      companyName: "",
      policyNumber: "",
      paidByPolicyLoan: "No",
    },

    declaration: {
      q1: { insured: "No", payor: "No", details: "" },
      q2a: { insured: "No", payor: "No" }, // aviation
      q2b: { insured: "No", payor: "No" }, // scuba
      q2c: { insured: "No", payor: "No", purpose: "" }, // motorcycle
      q2d: { insured: "No", payor: "No" }, // hazardous
      q3:  { insured: "No", payor: "No", details: "" },
      q4:  { insured: "No", payor: "No" }, // public official self
      q5:  { insured: "No", payor: "No" }, // public official relation
      q6:  { insured: "No", payor: "No", details: "" },
    },

    coverage: {
      planName: "", currency: "Php", faceAmount: "", paymentPeriod: "", paymentMode: "", premiumAmount: "",
      riders: {
        wp: false, ciwp: false, pdb: false, pddb: false, adb: false, addb: false,
        ci: false, hib: false, acib: false, termRider: false, atpd: false, policyFund: false, other: "",
      },
      dividendOption: "", defaultOption: "",
    },

    isVariableLife: "No",
    allocation: {
      rows: [
        { fund: "Equity Fund", single: "", regular: "" },
        { fund: "Balanced Fund", single: "", regular: "" },
        { fund: "Bond Fund", single: "", regular: "" },
      ],
    },

    beneficiaries: [createEmptyBeneficiaryRow()],

    otherInfo: {
      beneficialOwnerQ1: "No", // policyowner acting on own behalf?
      beneficialOwnerQ2: "No", // funds from another person?
      beneficialOwnerQ3: "No", // third party will benefit?
      additionalDeclaration: "",
      specialInstructions: "",
    },

    healthAdult: {
      height: "", weight: "",
      father: createEmptyFamilyMember(),
      mother: createEmptyFamilyMember(),
      siblings: Array.from({ length: 0 }, createEmptyFamilyMember),
      questions: {}, // keyed q1..q11 -> { answer: Yes/No, details: "" }
      womenQuestions: {},
    },

    healthMinor: {
      height: "", weight: "",
      birthWeight: "", gestationWeeks: "",
      questions: {},
    },

    tempCover: {
      optIn: "",
    },

    agreement: {
      dataPrivacyConsent: false,
      marketingOptIn: false,
      certifyTruth: false,
      place: "", date: "",
    },

    estatementTerms: { agree: false },

    authorization: {
      policyownerSignature: "", policyownerDate: "",
      lifeInsuredSignature: "", lifeInsuredDate: "",
      isMinor: "No",
      guardianName: "", guardianSignature: "", guardianDate: "",
      intermediaryName: "", intermediaryCode: "",
      useThumbmark: false,
    },

    submitted: false,

    questionnaires: {
      aviation: { triggered: false, completed: false, data: {} },
      scuba: { triggered: false, completed: false, data: {} },
      hazardous: { triggered: false, completed: false, data: {} },
      beneficialOwner: { triggered: false, completed: false, data: {} },
      publicOfficial: { triggered: false, completed: false, data: {} },
      publicOfficialRelation: { triggered: false, completed: false, data: {} },
    },
  };
}

const AppState = {
  data: getInitialState(),
  currentStepIndex: 0,
  maxReachedIndex: 0,

  reset() {
    this.data = getInitialState();
    this.currentStepIndex = 0;
    this.maxReachedIndex = 0;
    this.persist();
  },

  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: this.data,
        currentStepIndex: this.currentStepIndex,
        maxReachedIndex: this.maxReachedIndex,
      }));
      setAutosaveStatus("All changes saved");
    } catch (e) {
      setAutosaveStatus("Save failed (storage unavailable)");
    }
  },

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      this.data = Object.assign(getInitialState(), parsed.data);
      this.currentStepIndex = parsed.currentStepIndex || 0;
      this.maxReachedIndex = parsed.maxReachedIndex || 0;
      return true;
    } catch (e) {
      return false;
    }
  },

  loadFromObject(obj) {
    this.data = Object.assign(getInitialState(), obj.data || obj);
    this.currentStepIndex = obj.currentStepIndex || 0;
    this.maxReachedIndex = obj.maxReachedIndex || 0;
    this.persist();
  },

  exportJSON() {
    return JSON.stringify({ data: this.data, currentStepIndex: this.currentStepIndex, maxReachedIndex: this.maxReachedIndex }, null, 2);
  },
};

function setAutosaveStatus(text) {
  const el = document.getElementById("autosaveStatus");
  if (el) el.textContent = text;
}

/* Generic helper: get/set nested path like "policyowner.lastName" */
function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}
