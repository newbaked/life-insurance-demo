/* ============================================================
   printview.js — Renders a formal, paper-form-style replica of the
   Pioneer Life Inc. "Application Form for Life Insurance" PDF,
   populated with the current answers in AppState, for printing /
   saving as PDF. This replaces the old "print whatever wizard step
   is on screen" behaviour with a single continuous document that
   mirrors every section of the source PDF (I–XV) plus the TLIC.
   ============================================================ */

function pv_esc(str) {
  return esc(str);
}

function pv_yn(value) {
  if (value === "Yes") return `<span class="pv-chk pv-chk-on">☑</span> Yes &nbsp;&nbsp; <span class="pv-chk">☐</span> No`;
  if (value === "No") return `<span class="pv-chk">☐</span> Yes &nbsp;&nbsp; <span class="pv-chk pv-chk-on">☑</span> No`;
  return `<span class="pv-chk">☐</span> Yes &nbsp;&nbsp; <span class="pv-chk">☐</span> No`;
}

function pv_box(value) {
  return value ? `<span class="pv-chk pv-chk-on">☑</span>` : `<span class="pv-chk">☐</span>`;
}

function pv_field(label, value) {
  return `<div class="pv-field"><span class="pv-label">${pv_esc(label)}</span><span class="pv-value">${pv_esc(value) || "&nbsp;"}</span></div>`;
}

// Bordered, numbered grid cell — mirrors the PDF's dense boxed-field layout.
function pv_fcell(num, label, value) {
  return `<div class="pv-fcell"><span class="pv-fnum">${pv_esc(num)}. ${pv_esc(label)}</span><span class="pv-fval">${pv_esc(value) || "&nbsp;"}</span></div>`;
}

// A row of numbered cells, evenly divided into columns, bordered like the PDF's form grid.
function pv_frow(cells) {
  return `<div class="pv-frow" style="grid-template-columns:repeat(${cells.length},minmax(0,1fr))">${cells.join("")}</div>`;
}

function pv_fieldset(rows) {
  return `<div class="pv-fieldset">${rows.join("")}</div>`;
}

// Inline checkbox cluster for a grouped multiple-choice field (Sex, Civil Status, etc.)
function pv_choices(num, label, options, selected) {
  const opts = options.map((o) => `<span class="pv-choice-opt ${o === selected ? "on" : ""}">${pv_box(o === selected)} ${pv_esc(o)}</span>`).join("");
  return `<div class="pv-fcell"><span class="pv-choice-label">${pv_esc(num)}. ${pv_esc(label)}</span><div class="pv-choices">${opts}</div></div>`;
}

function pv_section(numeral, title, bodyHtml, variant) {
  const bandClass = variant === "red" ? "pv-band pv-band-red" : "pv-band";
  return `<div class="pv-section">
    <div class="${bandClass}">${pv_esc(numeral)}. ${pv_esc(title)}</div>
    <div class="pv-section-body">${bodyHtml}</div>
  </div>`;
}

function pv_personBlock(p, startNum) {
  let n = 1;
  const num = () => (startNum || "") + (n++);
  return `
    ${pv_fieldset([
      pv_frow([pv_fcell(num(), "Last Name", p.lastName), pv_fcell(num(), "First Name", p.firstName), pv_fcell(num(), "Middle Name", p.middleName), pv_fcell(num(), "Suffix", p.suffix)]),
      pv_frow([pv_fcell(num(), "Date of Birth", p.dob), pv_fcell(num(), "Place of Birth", p.placeOfBirth), pv_choices(num(), "Sex at Birth", SEX_OPTIONS, p.sex)]),
      pv_frow([pv_choices(num(), "Civil Status", CIVIL_STATUS_OPTIONS, p.civilStatus), pv_fcell(num(), "Nationality", p.nationality)]),
      pv_frow([pv_fcell(num(), "TIN", p.tin), pv_fcell(num(), "SSS / GSIS No.", p.sssGsis), pv_fcell(num(), "Mobile No.", p.mobileNo), pv_fcell(num(), "Email Address", p.email)]),
      pv_frow([pv_fcell(num(), "Home Address", p.homeAddress), pv_fcell(num(), "Office Address", p.officeAddress)]),
      pv_frow([pv_fcell(num(), "Occupation", p.occupation), pv_fcell(num(), "Employer / Business", p.employer)]),
      pv_frow([pv_fcell(num(), "Nature of Business / Duties", p.natureOfBusiness), pv_fcell(num(), "Source of Income", p.sourceOfIncome), pv_fcell(num(), "Gross Annual Income (Php)", p.grossAnnualIncome)]),
    ])}
    <div class="pv-subfield">U.S. citizen? ${pv_yn(p.isUSCitizen)} &nbsp;&nbsp;&nbsp; U.S. Green Card holder? ${pv_yn(p.hasGreenCard)}</div>
  `;
}

function pv_table(headers, rows) {
  if (!rows.length) return `<p class="pv-none">None declared.</p>`;
  return `<table class="pv-table"><thead><tr>${headers.map((h) => `<th>${pv_esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${pv_esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function pv_questionnaireBlock(key) {
  const q = AppState.data.questionnaires[key];
  if (!q || !q.triggered) return "";
  const def = QUESTIONNAIRES[key];
  const rows = def.fields.map((f) => {
    let v = q.data ? q.data[f.key] : "";
    if (f.type === "yesno") v = v === "Yes" ? "Yes" : v === "No" ? "No" : "";
    return pv_field(f.label, v);
  }).join("");
  return `<div class="pv-supplemental">
    <div class="pv-supplemental-title">Supplemental Form — ${pv_esc(def.title)} ${q.completed ? "(Completed)" : "(Incomplete)"}</div>
    <div class="pv-field-grid">${rows}</div>
  </div>`;
}

function pv_declQ(label, q, includePayor) {
  let extra = "";
  if (q.details !== undefined && (q.insured === "Yes" || (includePayor && q.payor === "Yes"))) extra = `<div class="pv-subfield">Details: ${pv_esc(q.details) || "&nbsp;"}</div>`;
  if (q.purpose !== undefined && (q.insured === "Yes" || (includePayor && q.payor === "Yes"))) extra = `<div class="pv-subfield">Purpose: ${pv_esc(q.purpose) || "&nbsp;"}</div>`;
  return `<div class="pv-decl-q">
    <div class="pv-decl-q-label">${pv_esc(label)}</div>
    <div class="pv-subfield">Life to be Insured: ${pv_yn(q.insured)}${includePayor ? ` &nbsp;&nbsp;&nbsp; Payor (if different): ${pv_yn(q.payor)}` : ` &nbsp;&nbsp;&nbsp; Payor column: Not Applicable (no PDB/PDDB rider, or Owner = Insured)`}</div>
    ${extra}
  </div>`;
}

function pv_medQ(label, qa) {
  const answer = qa ? qa.answer : "";
  const details = qa ? qa.details : "";
  return `<div class="pv-decl-q">
    <div class="pv-decl-q-label">${pv_esc(label)}</div>
    <div class="pv-subfield">${pv_yn(answer)}${answer === "Yes" ? ` &nbsp;—&nbsp; ${pv_esc(details) || "&nbsp;"}` : ""}</div>
  </div>`;
}

function buildPrintDocument() {
  const s = AppState.data;
  const sameAssured = s.insuredSameAsOwner;
  const insuredName = sameAssured === "Yes"
    ? `${s.policyowner.firstName} ${s.policyowner.lastName}`.trim()
    : `${s.insured.firstName} ${s.insured.lastName}`.trim();

  let html = `
    <div class="pv-page">
      <div class="pv-letterhead">
        <div class="pv-logo-mark"></div>
        <div class="pv-logo-text">
          <div class="pv-logo-word">PIONEER<sup style="font-size:9px;">&reg;</sup></div>
          <div class="pv-logo-tagline">YOUR INSURANCE</div>
        </div>
        <div class="pv-brand-text">
          <div class="pv-formtitle">Application Form for Life Insurance</div>
        </div>
        <div class="pv-meta">
          <div>Printed: ${pv_esc(new Date().toLocaleString())}</div>
          <div>Status: ${s.submitted ? "SUBMITTED" : "DRAFT"}</div>
        </div>
      </div>

      <div class="pv-banner">
        <strong>Role Confirmation:</strong> Is the Applicant/Policyowner also the Life to be Insured? ${pv_yn(sameAssured)}
      </div>
  `;

  // I. Policyowner
  html += pv_section("I", "Personal Information of the Policyowner / Applicant", pv_personBlock(s.policyowner));

  // II. Insured
  let insuredBody;
  if (sameAssured === "Yes") {
    insuredBody = `<p class="pv-none">Same person as the Policyowner / Applicant (see Section I above).</p>`;
  } else {
    insuredBody = `${pv_field("Relationship to Policyowner", s.insured.relationshipToOwner)}` + pv_personBlock(s.insured);
  }
  html += pv_section("II", "Personal Information of Life to be Insured", insuredBody);

  // III. History
  let histBody = `<div class="pv-subsection-title">1. Existing / Prior Insurance Policies</div>`;
  histBody += pv_table(["Insurance Company", "Plan Type", "Face Amount", "Year Issued", "Status"],
    s.history.ownPolicies.map((r) => [r.company, r.planType, r.amount, r.yearIssued, r.status]));
  histBody += `<div class="pv-subsection-title">2. Age &amp; Family Insurance Information</div>
    <div class="pv-subfield">Is the Life to be Insured below 25 years old? ${pv_yn(s.history.isBelowAge25)}</div>`;
  if (s.history.isBelowAge25 === "Yes") {
    histBody += pv_table(["Relationship", "Full Name", "Age", "Insurance Company", "Amount In Force"],
      s.history.parentsSiblings.map((r) => [r.relationship, r.name, r.age, r.insuranceCompany, r.amountInForce]));
  }
  histBody += `<div class="pv-subsection-title">3. Marital &amp; Spouse Insurance Information</div>
    <div class="pv-subfield">Is the Life to be Insured married? ${pv_yn(s.history.isMarried)}</div>`;
  if (s.history.isMarried === "Yes") {
    const sp = s.history.spouse;
    histBody += `<div class="pv-field-grid">
      ${pv_field("Spouse Last Name", sp.lastName)}${pv_field("Spouse First Name", sp.firstName)}
      ${pv_field("Spouse Middle Name", sp.middleName)}${pv_field("Spouse Date of Birth", sp.dob)}
      ${pv_field("Spouse Occupation", sp.occupation)}${pv_field("Spouse Insurance In Force", sp.insuranceInForce)}
    </div>`;
  }
  html += pv_section("III", "Life Insurance History", histBody);

  // IV. Replacement
  let replBody = `<div class="pv-reminder">Note: Replacement of an existing life insurance policy may not be in your best interest. Please review carefully before proceeding.</div>
    <div class="pv-subfield">Will this policy replace, lapse, or alter any existing life insurance policy? ${pv_yn(s.replacement.hasExistingToReplace)}</div>`;
  if (s.replacement.hasExistingToReplace === "Yes") {
    replBody += `<div class="pv-field-grid">
      ${pv_field("Existing Insurance Company", s.replacement.companyName)}
      ${pv_field("Existing Policy Number", s.replacement.policyNumber)}
    </div>${pv_field("Reason for Replacement", s.replacement.details)}`;
  }
  html += pv_section("IV", "Declaration on Proposed Replacement of Existing Policy", replBody, "red");

  // V. Declaration / risk questions
  const d = s.declaration;
  const payorApplicable = showPayorDeclarationQuestions();
  let declBody = payorApplicable
    ? `<p class="pv-none" style="color:#0a3d62;">Questions 1–3 Payor column applies — Owner differs from Insured and a PDB/PDDB rider is selected.</p>`
    : `<p class="pv-none">Questions 1–3 Payor column: Not Applicable — Owner = Insured, or no PDB/PDDB rider selected.</p>`;
  declBody += pv_declQ("Q1. Approved/pending change in job, duties, or visa/residency status that increases risk?", d.q1, payorApplicable);
  declBody += pv_declQ("Q2a. Fly an aircraft in any capacity other than as a fare-paying passenger?", d.q2a, payorApplicable);
  declBody += pv_questionnaireBlock("aviation");
  declBody += pv_declQ("Q2b. Engage in skin or scuba diving?", d.q2b, payorApplicable);
  declBody += pv_questionnaireBlock("scuba");
  declBody += pv_declQ("Q2c. Ride a motorcycle?", d.q2c, payorApplicable);
  declBody += pv_declQ("Q2d. Participate in other hazardous sports or extreme activities?", d.q2d, payorApplicable);
  declBody += pv_questionnaireBlock("hazardous");
  declBody += pv_declQ("Q3. Ever declined, postponed, or rated for life or health insurance?", d.q3, payorApplicable);
  declBody += pv_declQ("Q4. Present or former government official, employee, or political candidate?", d.q4, true);
  declBody += pv_questionnaireBlock("publicOfficial");
  declBody += pv_declQ("Q5. Close relationship with a government official as described above?", d.q5, true);
  declBody += pv_questionnaireBlock("publicOfficialRelation");
  declBody += pv_declQ("Q6. Currently involved in any lawsuit, litigation, or investigation?", d.q6, true);
  html += pv_section("V", "Declaration of Life to be Insured and Payor", declBody);

  // VI. Coverage
  const c = s.coverage;
  const plan = getPlanByName(c.planName);
  const isVariable = isVariableLifePlan();
  const isParticipating = isParticipatingPlan();
  let covBody = `<div class="pv-field-grid">
    ${pv_field("Plan Name / Product", c.planName)}
    ${pv_field("Product Line", plan ? plan.productLine : "")}
    ${plan && plan.currency === "PESO/USD" ? pv_field("Currency", c.currency) : ""}
    ${pv_field("Face Amount", c.faceAmount)}
    ${pv_field("Payment Period", c.paymentPeriod)}
    ${pv_field("Mode of Premium Payment", c.paymentMode)}
    ${pv_field("Premium Amount", c.premiumAmount)}
    ${isParticipating ? pv_field("7. Dividend Option (Participating only)", c.dividendOption) : ""}
    ${pv_field(isVariable ? "8b. Charges Default Option" : "8a. Premium Default Option", c.defaultOption)}
  </div>
  <div class="pv-subsection-title">6. Riders</div>
  <div class="pv-subfield">
    ${RIDER_OPTIONS.map((r) => `${pv_box(c.riders[r.key])} ${pv_esc(r.label)}`).join(" &nbsp;&nbsp; ")}
    ${c.riders.other ? ` &nbsp;&nbsp; Other: ${pv_esc(c.riders.other)}` : ""}
  </div>
  <div class="pv-subfield">Variable Life (derived from Plan)? ${pv_yn(isVariable ? "Yes" : "No")}</div>`;
  html += pv_section("VI", "Life Insurance Coverage Applied For", covBody);

  // VII. Allocation
  let allocBody;
  if (!isVariable) {
    allocBody = `<p class="pv-none">Not applicable — not a Variable Life policy.</p>`;
  } else {
    const rows = s.allocation.rows;
    let singleTotal = 0, regularTotal = 0;
    rows.forEach((r) => { singleTotal += Number(r.single) || 0; regularTotal += Number(r.regular) || 0; });
    allocBody = pv_table(["Fund", "Single Premium (%)", "Regular Premium (%)"], rows.map((r) => [r.fund, r.single, r.regular]));
    allocBody += `<div class="pv-subfield"><strong>Totals — Single: ${singleTotal}% &nbsp; Regular: ${regularTotal}%</strong></div>`;
  }
  html += pv_section("VII", "Fund Allocation Instruction (Variable Life Only)", allocBody);

  // VIII. Beneficiaries
  const beneBody = `<div class="pv-legend">*M-Male F-Female &nbsp; P-Primary S-Secondary &nbsp; R-Revocable I-Irrevocable</div>` + pv_table(
    ["Name", "*Sex", "Relationship", "Birthdate", "Place of Birth", "Contact No.", "Address", "Nationality", "*P/S", "Share %", "*R/I"],
    s.beneficiaries.map((r) => [r.name, (r.sex || "").charAt(0), r.relationship, r.birthdate, r.placeOfBirth, r.contactNo, r.address, r.nationality, r.designation === "Primary" ? "P" : r.designation === "Secondary" ? "S" : r.designation, (r.sharePercent || 0) + "%", r.revocable === "Revocable" ? "R" : r.revocable === "Irrevocable" ? "I" : r.revocable])
  );
  html += pv_section("VIII", "Designated Beneficiaries", beneBody);

  // IX. Other information
  const o = s.otherInfo;
  let otherBody = `<div class="pv-subfield">Are you entering into this transaction on your own behalf? ${pv_yn(o.beneficialOwnerQ1)}</div>
    <div class="pv-subfield">Will the premiums be funded by someone other than yourself? ${pv_yn(o.beneficialOwnerQ2)}</div>
    <div class="pv-subfield">Will a third party (other than named beneficiaries) benefit from this policy? ${pv_yn(o.beneficialOwnerQ3)}</div>
    ${pv_questionnaireBlock("beneficialOwner")}
    ${pv_field("Additional Declaration", o.additionalDeclaration)}
    ${pv_field("Special Instructions to Head Office", o.specialInstructions)}`;
  html += pv_section("IX", "Other Information", otherBody);

  // X. Health adult
  const h = s.healthAdult;
  const effectiveSex = sameAssured === "Yes" ? s.policyowner.sex : s.insured.sex;
  const showHealthAdult = showHealthAdultSection();
  const healthSubject = healthAdultSubjectLabel();
  let healthAdultBody;
  if (!showHealthAdult) {
    const reason = planHasAutomaticAcceptance()
      ? "the selected Plan qualifies for Automatic Acceptance (AA)"
      : "no PDB/PDDB rider applies to the Payor";
    healthAdultBody = `<p class="pv-none">Not applicable — ${pv_esc(reason)}. (Rules BR-009/BR-010/BR-011)</p>`;
  } else {
    healthAdultBody = `<div class="pv-field-grid">${pv_field("Height (cm)", h.height)}${pv_field("Weight (kg)", h.weight)}</div>
    <div class="pv-subsection-title">Family Medical History</div>`;
    const famRows = [
      ["Father", h.father.age, h.father.status, h.father.causeOfDeath, h.father.healthCondition],
      ["Mother", h.mother.age, h.mother.status, h.mother.causeOfDeath, h.mother.healthCondition],
      ...h.siblings.map((sib) => [sib.name || "Sibling", sib.age, sib.status, sib.causeOfDeath, sib.healthCondition]),
    ];
    healthAdultBody += pv_table(["Relation", "Age", "Status", "Cause of Death (if any)", "Known Health Condition"], famRows);
    healthAdultBody += `<div class="pv-subsection-title">Medical History Questions</div>`;
    ADULT_MEDICAL_QUESTIONS.forEach(([key, label]) => { healthAdultBody += pv_medQ(label, h.questions[key]); });
    if (effectiveSex === "Female") {
      healthAdultBody += `<div class="pv-subsection-title">Women-Specific Questions</div>`;
      healthAdultBody += pv_medQ("Are you currently pregnant?", h.womenQuestions.pregnant);
      healthAdultBody += pv_medQ("Have you had any gynecological/reproductive health condition?", h.womenQuestions.reproductive);
    }
  }
  html += pv_section("X", `Health Declaration of ${pv_esc(healthSubject)} (Age 16 and over) or PAYOR (if applying for PDB/PDDB)`, healthAdultBody, "red");

  // XI. Health minor
  const hm = s.healthMinor;
  const showHealthMinor = showHealthMinorSection();
  let healthMinorBody;
  if (!showHealthMinor) {
    healthMinorBody = `<p class="pv-none">Not applicable — the Life to be Insured is 16 years old or above. (Rule BR-013)</p>`;
  } else {
    healthMinorBody = `<div class="pv-field-grid">
      ${pv_field("Height (cm)", hm.height)}${pv_field("Weight (kg)", hm.weight)}
      ${pv_field("Birth Weight (kg)", hm.birthWeight)}${pv_field("Gestation Period (weeks)", hm.gestationWeeks)}
    </div><div class="pv-subsection-title">Medical History Questions</div>`;
    MINOR_MEDICAL_QUESTIONS.forEach(([key, label]) => { healthMinorBody += pv_medQ(label, hm.questions[key]); });
  }
  html += pv_section("XI", "Health Declaration of Life to be Insured (Below Age 16)", healthMinorBody, "red");

  // XII. Agreement
  const a = s.agreement;
  const agreeBody = `<div class="pv-subfield">${pv_box(a.dataPrivacyConsent)} I consent to the collection and processing of my personal and sensitive personal information.</div>
    <div class="pv-subfield">${pv_box(a.marketingOptIn)} I would like to receive marketing and promotional communications (optional).</div>
    <div class="pv-subfield">${pv_box(a.certifyTruth)} I certify that all statements and answers in this application are true, complete, and correctly recorded.</div>
    <div class="pv-field-grid">${pv_field("Place Signed", a.place)}${pv_field("Date Signed", a.date)}</div>`;
  html += pv_section("XII", "Declaration, Disclosure and Agreement", agreeBody);

  // XIII. Temp cover
  const showTemp = showTempCoverOffer();
  html += pv_section("XIII", "Temporary Life Insurance Cover Notice",
    showTemp
      ? `<p>Subject to the conditions stated in the Temporary Life Insurance Certificate (TLIC), the Life to be Insured may be
         covered temporarily for up to <strong>Php 1,000,000</strong> (maximum aggregate) for a period of <strong>45 days</strong>
         from the date of this application, provided all requirements are satisfied.</p>
         <div class="pv-subfield">Opted to avail of Temporary Life Insurance Cover? ${pv_yn(s.tempCover.optIn)}</div>`
      : `<p class="pv-none">Not applicable — Temporary Life Insurance Cover does not apply to Variable Life plans. (Rule BR-015)</p>`);

  // XIV. e-Statement
  html += pv_section("XIV", "Terms and Conditions of e-Statement Service",
    `<div class="pv-subfield">${pv_box(s.estatementTerms.agree)} I have read, understood, and agree to the Terms and Conditions of the e-Statement Service.</div>`);

  // XV. Authorization
  const auth = s.authorization;
  let authBody = `<p style="font-size:10px;">I/We hereby authorize Pioneer Life Inc. to obtain and exchange medical and other related information
    necessary for the underwriting and administration of this application, as set out in the Data Privacy Consent above.</p>
    <div class="pv-siggrid">
      <div class="pv-sigcell">
        <div class="pv-sigline">${pv_esc(auth.policyownerSignature) || "&nbsp;"}</div>
        <div>Signature over Printed Name of Policyowner / Applicant</div>
        <div class="pv-sigmeta"><div>Date: ${pv_esc(auth.policyownerDate) || "&nbsp;"}</div><div>Place: ${pv_esc(a.place) || "&nbsp;"}</div></div>
      </div>
      <div class="pv-sigcell">
        <div class="pv-sigline">${pv_esc(auth.lifeInsuredSignature) || "&nbsp;"}</div>
        <div>Signature over Printed Name of Life to be Insured (if different)</div>
        <div class="pv-sigmeta"><div>Date: ${pv_esc(auth.lifeInsuredDate) || "&nbsp;"}</div><div>Place: ${pv_esc(a.place) || "&nbsp;"}</div></div>
      </div>
      <div class="pv-sigcell">
        ${auth.useThumbmark ? `<div class="pv-sigbox"></div>` : ""}
        <div class="pv-sigline">${(isInsuredMinor() === null ? auth.isMinor === "Yes" : isInsuredMinor()) ? pv_esc(auth.guardianName) || "&nbsp;" : "N/A"}</div>
        <div>Signature over Printed Name of Parent / Guardian (if Life to be Insured is below age 18)</div>
        <div class="pv-sigmeta"><div>Date: ${pv_esc(auth.guardianDate) || "&nbsp;"}</div></div>
      </div>
      <div class="pv-sigcell">
        <div class="pv-sigline">${pv_esc(auth.intermediaryName) || "&nbsp;"}</div>
        <div>Signature over Printed Name of Intermediary</div>
        <div class="pv-sigmeta"><div>Code Number: ${pv_esc(auth.intermediaryCode) || "&nbsp;"}</div></div>
      </div>
    </div>`;
  html += pv_section("XV", "Authorization to Furnish Medical / Other Related Information", authBody);

  // TLIC (only if submitted, temp cover applies, and the applicant opted in) — detachable
  // certificate styled after the PDF's Page 8 layout
  if (s.submitted && showTemp && s.tempCover.optIn === "Yes") {
    html += `<div class="pv-tlic2">
      <div class="pv-tlic2-head"><div class="pv-logo-mark" style="width:26px;height:26px;"></div> TEMPORARY LIFE INSURANCE CERTIFICATE (TLIC) — Not Applicable to Variable Life</div>
      <div class="pv-tlic2-body">
        <p style="font-size:9.5px;">This Certificate acknowledges the deposit of ${pv_box(true)} Php ${pv_esc(s.coverage.premiumAmount) || "____________"}
          with Pioneer Life Inc. (the "Company") on Application for ${pv_esc(insuredName)}.</p>
        <div class="pv-tlic2-label">Date Coverage Begins</div>
        <p style="font-size:9.5px; margin:2px 0;">The temporary life insurance coverage begins on the date the signed application, together with a deposit of the
          chosen premium, is received by the Company — ${pv_esc(new Date().toLocaleDateString())}.</p>
        <div class="pv-tlic2-label">Amount of Coverage — Php 1,000,000 Maximum Aggregate Limit</div>
        <p style="font-size:9.5px; margin:2px 0;">If the Life to be Insured dies while this temporary insurance is in effect, the Company will pay to the designated
          beneficiary/ies, subject to the maximum aggregate limit, the lesser of: (a) the amount of all applicable death benefits
          applied for in the application; or (b) Php 1,000,000.00.</p>
        <div class="pv-tlic2-label">Date Coverage Terminates — 45-Day Maximum Period</div>
        <p style="font-size:9.5px; margin:2px 0;">This Certificate terminates automatically on the earliest of: (a) 45 days from the effective date of this Certificate;
          or (b) the date the policy applied for is issued and becomes effective; or (c) the date specified in the notice
          declining the application; or (d) the date deposit is refunded.</p>
        <div class="pv-tlic2-address">
          <strong>PIONEER LIFE INC.</strong><br>
          5th Avenue, cor. 26th Street, Bonifacio Global City, Taguig City 1635, Philippines<br>
          Tel. +63 2 8812 7777 &bull; +63 2 7750 9999 &bull; www.pioneer.com.ph
        </div>
      </div>
    </div>`;
  }

  html += `
      <div class="pv-footer"><span>indlifeapp_2025</span><span>Generated ${pv_esc(new Date().toLocaleString())}</span></div>
    </div>
  `;
  return html;
}

function printApplication() {
  const area = document.getElementById("printArea");
  area.innerHTML = buildPrintDocument();
  window.print();
}
