/* ============================================================
   validate.js — Per-step and whole-application validation rules.
   Keeps required-field logic in one place, separate from render.
   ============================================================ */

function err(stepId, message) { return { stepId, message }; }

function validateStep(stepId) {
  const s = AppState.data;
  const errors = [];

  switch (stepId) {
    case "start": {
      if (s.insuredSameAsOwner !== "Yes" && s.insuredSameAsOwner !== "No") {
        errors.push(err(stepId, "Please confirm whether the Applicant/Policyowner is also the Life to be Insured (Assured) before continuing."));
      }
      break;
    }
    case "policyowner": {
      const p = s.policyowner;
      ["lastName", "firstName", "dob", "sex", "civilStatus", "nationality", "mobileNo", "homeAddress", "occupation"].forEach((k) => {
        if (!p[k]) errors.push(err(stepId, `Policyowner: "${k}" is required.`));
      });
      break;
    }
    case "insured": {
      if (s.insuredSameAsOwner === "No") {
        const p = s.insured;
        ["relationshipToOwner", "lastName", "firstName", "dob", "sex", "civilStatus", "nationality", "mobileNo", "homeAddress", "occupation"].forEach((k) => {
          if (!p[k]) errors.push(err(stepId, `Life to be Insured: "${k}" is required.`));
        });
      }
      break;
    }
    case "history": {
      if (s.history.isMarried === "Yes") {
        if (!s.history.spouse.lastName || !s.history.spouse.firstName) {
          errors.push(err(stepId, "Spouse name is required since the Life to be Insured is married."));
        }
      }
      break;
    }
    case "replacement": {
      if (s.replacement.hasExistingToReplace === "Yes") {
        if (!s.replacement.companyName || !s.replacement.policyNumber || !s.replacement.details) {
          errors.push(err(stepId, "Replacement details (company, policy number, reason) are required."));
        }
      }
      break;
    }
    case "declaration": {
      const d = s.declaration;
      const anyYes = (q) => q.insured === "Yes" || (showPayorDeclarationQuestions() && q.payor === "Yes");
      if (anyYes(d.q1) && !d.q1.details) errors.push(err(stepId, "Q1 details are required."));
      if (anyYes(d.q2c) && !d.q2c.purpose) errors.push(err(stepId, "Q2c motorcycle purpose is required."));
      if (anyYes(d.q3) && !d.q3.details) errors.push(err(stepId, "Q3 details are required."));
      if ((d.q6.insured === "Yes" || d.q6.payor === "Yes") && !d.q6.details) errors.push(err(stepId, "Q6 details are required."));

      const checkQuestionnaire = (triggerQ, key, label) => {
        if (anyYes(triggerQ) && !s.questionnaires[key].completed) {
          errors.push(err(stepId, `${label} must be completed before continuing.`));
        }
      };
      checkQuestionnaire(d.q2a, "aviation", "Aviation Questionnaire");
      checkQuestionnaire(d.q2b, "scuba", "Skin/Scuba Diving Questionnaire");
      checkQuestionnaire(d.q2d, "hazardous", "Hazardous/Extreme Sports Questionnaire");
      if ((d.q4.insured === "Yes" || d.q4.payor === "Yes") && !s.questionnaires.publicOfficial.completed) {
        errors.push(err(stepId, "Political Exposure (Self) details must be completed before continuing."));
      }
      if ((d.q5.insured === "Yes" || d.q5.payor === "Yes") && !s.questionnaires.publicOfficialRelation.completed) {
        errors.push(err(stepId, "Political Exposure (Relation) details must be completed before continuing."));
      }
      break;
    }
    case "coverage": {
      const c = s.coverage;
      ["planName", "faceAmount", "paymentPeriod", "paymentMode", "premiumAmount"].forEach((k) => {
        if (!c[k]) errors.push(err(stepId, `Coverage: "${k}" is required.`));
      });
      if (currentPlan() && currentPlan().currency === "PESO/USD" && !c.currency) {
        errors.push(err(stepId, "Coverage: currency selection is required for this plan."));
      }
      break;
    }
    case "allocation": {
      if (showAllocationSection()) {
        const rows = s.allocation.rows;
        const singleTotal = rows.reduce((sum, r) => sum + (Number(r.single) || 0), 0);
        const regularTotal = rows.reduce((sum, r) => sum + (Number(r.regular) || 0), 0);
        if (singleTotal !== 100) errors.push(err(stepId, `Single Premium fund allocation must total 100% (currently ${singleTotal}%).`));
        if (regularTotal !== 100) errors.push(err(stepId, `Regular Premium fund allocation must total 100% (currently ${regularTotal}%).`));
      }
      break;
    }
    case "beneficiaries": {
      const rows = s.beneficiaries;
      if (!rows.length || !rows.some((r) => r.name)) {
        errors.push(err(stepId, "At least one named beneficiary is required."));
      }
      const primaryTotal = rows.filter((r) => r.designation === "Primary").reduce((sum, r) => sum + (Number(r.sharePercent) || 0), 0);
      if (rows.some((r) => r.designation === "Primary") && primaryTotal !== 100) {
        errors.push(err(stepId, `Primary beneficiary shares must total 100% (currently ${primaryTotal}%).`));
      }
      break;
    }
    case "otherinfo": {
      const o = s.otherInfo;
      if ((o.beneficialOwnerQ1 === "Yes" || o.beneficialOwnerQ2 === "Yes" || o.beneficialOwnerQ3 === "Yes") && !s.questionnaires.beneficialOwner.completed) {
        errors.push(err(stepId, "Beneficial Owner Declaration must be completed before continuing."));
      }
      break;
    }
    case "healthadult": {
      if (!showHealthAdultSection()) break;
      const h = s.healthAdult;
      if (!h.height) errors.push(err(stepId, "Height is required."));
      if (!h.weight) errors.push(err(stepId, "Weight is required."));
      Object.keys(h.questions).forEach((k) => {
        const q = h.questions[k];
        if (q.answer === "Yes" && !q.details) errors.push(err(stepId, `Please provide details for medical question "${k}".`));
      });
      break;
    }
    case "tempcover": {
      if (showTempCoverOffer() && s.tempCover.optIn !== "Yes" && s.tempCover.optIn !== "No") {
        errors.push(err(stepId, "Please indicate whether you wish to avail of the Temporary Life Insurance Cover."));
      }
      break;
    }
    case "agreement": {
      const a = s.agreement;
      if (!a.dataPrivacyConsent) errors.push(err(stepId, "Data Privacy Consent must be accepted."));
      if (!a.certifyTruth) errors.push(err(stepId, "You must certify that the information provided is true and complete."));
      if (!a.place) errors.push(err(stepId, "Place signed is required."));
      if (!a.date) errors.push(err(stepId, "Date signed is required."));
      break;
    }
    case "estatement": {
      if (!s.estatementTerms.agree) errors.push(err(stepId, "You must agree to the e-Statement Terms and Conditions."));
      break;
    }
    case "authorization": {
      const a = s.authorization;
      if (!a.policyownerSignature) errors.push(err(stepId, "Policyowner signature is required."));
      if (!a.policyownerDate) errors.push(err(stepId, "Policyowner signature date is required."));
      if (!a.lifeInsuredSignature) errors.push(err(stepId, "Life to be Insured signature is required."));
      if (!a.lifeInsuredDate) errors.push(err(stepId, "Life to be Insured signature date is required."));
      const derivedMinor = isInsuredMinor();
      const treatAsMinor = derivedMinor === null ? a.isMinor === "Yes" : derivedMinor;
      if (treatAsMinor && (!a.guardianName || !a.guardianSignature || !a.guardianDate)) {
        errors.push(err(stepId, "Parent/Guardian details are required for a minor applicant."));
      }
      break;
    }
    default:
      break;
  }
  return errors;
}

function validateAll() {
  let all = [];
  FORM_STEPS.forEach((step) => {
    if (step.id === "review") return;
    all = all.concat(validateStep(step.id));
  });
  return all;
}
