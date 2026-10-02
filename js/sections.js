/* ============================================================
   sections.js — Render functions for every wizard step, mirroring
   Sections I–XV of the Pioneer Life Inc. application plus a
   final Review/Submit step with the Temporary Life Insurance
   Certificate (TLIC) summary.
   ============================================================ */

const SEX_OPTIONS = ["Male", "Female"];
const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Separated", "Annulled"];

function personFieldsHtml(prefix, opts = {}) {
  return fieldGrid([
    textField(`${prefix}.lastName`, "Last Name", { required: true }),
    textField(`${prefix}.firstName`, "First Name", { required: true }),
    textField(`${prefix}.middleName`, "Middle Name"),
    textField(`${prefix}.suffix`, "Suffix (Jr., Sr., III)"),
    dateField(`${prefix}.dob`, "Date of Birth", { required: true }),
    textField(`${prefix}.placeOfBirth`, "Place of Birth"),
    selectField(`${prefix}.sex`, "Sex", SEX_OPTIONS, { required: true, trigger: true }),
    selectField(`${prefix}.civilStatus`, "Civil Status", CIVIL_STATUS_OPTIONS, { required: true }),
    textField(`${prefix}.nationality`, "Nationality", { required: true }),
    textField(`${prefix}.tin`, "TIN"),
    textField(`${prefix}.sssGsis`, "SSS / GSIS Number"),
    textField(`${prefix}.mobileNo`, "Mobile Number", { required: true }),
    textField(`${prefix}.email`, "Email Address", { type: "email" }),
    textareaField(`${prefix}.homeAddress`, "Home Address", { span: 2, required: true }),
    textareaField(`${prefix}.officeAddress`, "Office Address", { span: 2 }),
    textField(`${prefix}.occupation`, "Occupation", { required: true }),
    textField(`${prefix}.employer`, "Name of Employer / Business"),
    textField(`${prefix}.natureOfBusiness`, "Nature of Business / Duties"),
    textField(`${prefix}.sourceOfIncome`, "Source of Income"),
    numberField(`${prefix}.grossAnnualIncome`, "Gross Annual Income (Php)"),
    yesNoField(`${prefix}.isUSCitizen`, "Are you a U.S. citizen?"),
    yesNoField(`${prefix}.hasGreenCard`, "Do you hold a U.S. Green Card?"),
  ]);
}

function renderSection_start() {
  const same = val("insuredSameAsOwner");
  return `
    <h2 class="section-title">Before You Begin: Who is the Applicant and Who is the Assured?</h2>
    <p class="section-sub">This application distinguishes between two roles. Please confirm which applies before continuing, since it determines which sections you need to fill in.</p>
    <div class="info-box">
      <strong>Policyowner / Applicant</strong> — the person applying for and owning the policy, responsible for paying premiums and making policy decisions.<br/>
      <strong>Life to be Insured / Assured</strong> — the person whose life is covered by the policy (the one on whom the insurance payout is based).
    </div>
    ${fieldGrid([yesNoField("insuredSameAsOwner", "Are you (the Applicant / Policyowner) also the Life to be Insured (Assured)?", { required: true, trigger: true })])}
    ${same === "Yes" ? `<div class="info-box" style="border-color:#1e8a4c;background:#eaf7ef;color:#1e8a4c;">You will complete one set of personal details that applies to both the Policyowner and the Life to be Insured.</div>` : ""}
    ${same === "No" ? `<div class="info-box" style="border-color:#b8860b;background:#fffdf5;color:#8a6d00;">You will need to complete separate personal details for the Policyowner (Section I) and the Life to be Insured (Section II).</div>` : ""}
  `;
}

function renderSection_policyowner() {
  return `
    <h2 class="section-title">I. Personal Information of the Policyowner / Applicant</h2>
    <p class="section-sub">This is the person who owns the policy and is responsible for premium payments.</p>
    ${personFieldsHtml("policyowner")}
  `;
}

function renderSection_insured() {
  const same = val("insuredSameAsOwner");
  let body = "";
  if (same === "Yes") {
    body = `<div class="info-box">You confirmed at the start that the Applicant/Policyowner is also the Life to be Insured. This section's information will mirror the Policyowner's information entered in Section I.
      <div style="margin-top:8px;"><button type="button" class="btn btn-outline btn-small" data-goto-step="start">Change this answer</button></div>
    </div>`;
  } else {
    body = `<div class="info-box">You confirmed at the start that the Life to be Insured is a different person from the Policyowner. Please complete their details below.
        <div style="margin-top:8px;"><button type="button" class="btn btn-outline btn-small" data-goto-step="start">Change this answer</button></div>
      </div>`
      + fieldGrid([selectField("insured.relationshipToOwner", "Relationship to Policyowner", ["Spouse", "Child", "Parent", "Sibling", "Business Partner", "Other"], { required: true })])
      + personFieldsHtml("insured");
  }
  return `
    <h2 class="section-title">II. Personal Information of Life to be Insured</h2>
    <p class="section-sub">Complete only if the Life to be Insured is different from the Policyowner.</p>
    ${body}
  `;
}


function repeatingTable(arrayPath, columns, rowFactory, addLabel) {
  const arr = getPath(AppState.data, arrayPath) || [];
  const head = columns.map((c) => `<th>${esc(c.label)}</th>`).join("") + `<th></th>`;
  const rows = arr.map((row, idx) => {
    const cells = columns.map((c) => {
      const path = `${arrayPath}.${idx}.${c.key}`;
      let input;
      if (c.type === "select") {
        const options = c.options.map((o) => `<option value="${esc(o)}" ${val(path) === o ? "selected" : ""}>${esc(o)}</option>`).join("");
        input = `<select data-bind="${path}"><option value="">—</option>${options}</select>`;
      } else {
        input = `<input type="${c.type || "text"}" data-bind="${path}" value="${esc(val(path))}" />`;
      }
      return `<td>${input}</td>`;
    }).join("");
    return `<tr>${cells}<td><button type="button" class="row-remove-btn" data-remove-row="${arrayPath}|${idx}">Remove</button></td></tr>`;
  }).join("");
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${rows || `<tr><td colspan="${columns.length + 1}" style="color:#8a98a6;">No rows yet.</td></tr>`}</tbody></table></div>
    <button type="button" class="btn btn-secondary btn-small add-row-btn" data-add-row="${arrayPath}">${esc(addLabel)}</button>`;
}

function renderSection_history() {
  const belowAge25 = val("history.isBelowAge25");
  const isMarried = val("history.isMarried");
  return `
    <h2 class="section-title">III. Life Insurance History</h2>
    <p class="section-sub">Details of existing or prior life insurance coverage for the Life to be Insured.</p>

    ${subsectionTitle("1. Existing / Prior Insurance Policies")}
    ${repeatingTable("history.ownPolicies", [
      { key: "company", label: "Insurance Company" },
      { key: "planType", label: "Plan Type" },
      { key: "amount", label: "Face Amount", type: "number" },
      { key: "yearIssued", label: "Year Issued" },
      { key: "status", label: "Status", type: "select", options: ["In Force", "Lapsed", "Matured", "Surrendered"] },
    ], null, "+ Add Policy")}

    ${subsectionTitle("2. Age & Family Insurance Information")}
    ${fieldGrid([yesNoField("history.isBelowAge25", "Is the Life to be Insured below 25 years old?", { trigger: true })])}
    ${belowAge25 === "Yes" ? `
      <div class="info-box">Since the Life to be Insured is below 25, please provide parents'/siblings' insurance information.</div>
      ${repeatingTable("history.parentsSiblings", [
        { key: "relationship", label: "Relationship", type: "select", options: ["Father", "Mother", "Brother", "Sister"] },
        { key: "name", label: "Full Name" },
        { key: "age", label: "Age", type: "number" },
        { key: "insuranceCompany", label: "Insurance Company" },
        { key: "amountInForce", label: "Amount In Force", type: "number" },
      ], null, "+ Add Parent / Sibling")}
    ` : ""}

    ${subsectionTitle("3. Marital & Spouse Insurance Information")}
    ${fieldGrid([yesNoField("history.isMarried", "Is the Life to be Insured married?", { trigger: true })])}
    ${isMarried === "Yes" ? fieldGrid([
      textField("history.spouse.lastName", "Spouse Last Name", { required: true }),
      textField("history.spouse.firstName", "Spouse First Name", { required: true }),
      textField("history.spouse.middleName", "Spouse Middle Name"),
      dateField("history.spouse.dob", "Spouse Date of Birth"),
      textField("history.spouse.occupation", "Spouse Occupation"),
      numberField("history.spouse.insuranceInForce", "Spouse Insurance In Force (Php)"),
    ]) : ""}
  `;
}

function renderSection_replacement() {
  const has = val("replacement.hasExistingToReplace");
  return `
    <h2 class="section-title">IV. Declaration on Proposed Replacement of Existing Policy</h2>
    <p class="section-sub">Required by regulation whenever a new policy may replace an existing one.</p>
    ${fieldGrid([
      yesNoField("replacement.hasExistingToReplace", "Will this policy replace, lapse, or alter any existing life insurance policy?", { trigger: true }),
      yesNoField("replacement.paidByPolicyLoan", "Will premiums for the insurance applied for be paid by a policy loan from any existing policy?"),
    ])}
    ${has === "Yes" ? fieldGrid([
      textField("replacement.companyName", "Existing Insurance Company", { required: true }),
      textField("replacement.policyNumber", "Existing Policy Number", { required: true }),
      textareaField("replacement.details", "Explain the reason for replacement", { span: 2, required: true }),
    ]) : ""}
  `;
}

function yesNoPairRow(label, basePath, opts = {}) {
  const includePayor = opts.includePayor !== false;
  return `<div class="subsection-title" style="border:none;margin:18px 0 6px;font-size:13.5px;">${esc(label)}</div>` +
    fieldGrid(includePayor ? [
      yesNoField(`${basePath}.insured`, "Life to be Insured", { trigger: true }),
      yesNoField(`${basePath}.payor`, "Payor (if different)", { trigger: true }),
    ] : [
      yesNoField(`${basePath}.insured`, "Life to be Insured", { trigger: true }),
    ]);
}

function renderSection_declaration() {
  const d = AppState.data.declaration;
  const anyYes = (q) => q.insured === "Yes" || q.payor === "Yes";
  const payorApplicable = showPayorDeclarationQuestions();
  let html = `
    <h2 class="section-title">V. Declaration of Life to be Insured and Payor</h2>
    <p class="section-sub">Answer every question for both the Life to be Insured and the Payor (if different). A "Yes" answer may trigger a short follow-up questionnaire.</p>
  `;

  html += payorApplicable
    ? `<div class="info-box">Because the Policyowner is different from the Life to be Insured and a Payor's Death Benefit (PDB) or Payor's Death and Disability Benefit (PDDB) rider is selected, Questions 1–3 are also required for the Payor. <em>(Rule BR-005)</em></div>`
    : `<div class="info-box">Questions 1–3's Payor column does not apply — it only applies when the Policyowner is different from the Life to be Insured <strong>and</strong> a PDB or PDDB rider is selected in Section VI. <em>(Rule BR-005)</em></div>`;

  html += yesNoPairRow("Q1. Do you have any approved or pending change in job, duties, or visa/residency status that increases risk (e.g., overseas deployment, hazardous occupation)?", "declaration.q1", { includePayor: payorApplicable });
  if (anyYes(d.q1)) html += fieldGrid([textareaField("declaration.q1.details", "Please provide details", { span: 2, required: true })]);

  html += yesNoPairRow("Q2a. Do you fly an aircraft in any capacity other than as a fare-paying passenger?", "declaration.q2a", { includePayor: payorApplicable });
  if (anyYes(d.q2a)) html += reflexCard("aviation", "An Aviation Questionnaire is required to complete this section.");

  html += yesNoPairRow("Q2b. Do you engage in skin or scuba diving?", "declaration.q2b", { includePayor: payorApplicable });
  if (anyYes(d.q2b)) html += reflexCard("scuba", "A Skin/Scuba Diving Questionnaire is required to complete this section.");

  html += yesNoPairRow("Q2c. Do you ride a motorcycle?", "declaration.q2c", { includePayor: payorApplicable });
  if (anyYes(d.q2c)) html += fieldGrid([selectField("declaration.q2c.purpose", "Purpose of Motorcycle Riding", ["Personal Transport", "Occupation", "Recreational Hobby"], { required: true })]);

  html += yesNoPairRow("Q2d. Do you participate in other hazardous sports or extreme activities (e.g., mountain climbing, motor racing, skydiving, bungee jumping)?", "declaration.q2d", { includePayor: payorApplicable });
  if (anyYes(d.q2d)) html += reflexCard("hazardous", "A Hazardous/Extreme Sports Questionnaire is required to complete this section.");

  html += yesNoPairRow("Q3. Have you ever been declined, postponed, or rated (charged extra premium) for life or health insurance?", "declaration.q3", { includePayor: payorApplicable });
  if (anyYes(d.q3)) html += fieldGrid([textareaField("declaration.q3.details", "Please provide details", { span: 2, required: true })]);

  html += yesNoPairRow("Q4. Are you a present or former government official, employee, or political candidate?", "declaration.q4");
  if (anyYes(d.q4)) html += reflexCard("publicOfficial", "Additional political exposure details are required.");

  html += yesNoPairRow("Q5. Do you have a close relationship (relative/associate) with a government official as described above?", "declaration.q5");
  if (anyYes(d.q5)) html += reflexCard("publicOfficialRelation", "Additional political exposure details are required.");

  html += yesNoPairRow("Q6. Are you currently involved in any lawsuit, litigation, or investigation (as plaintiff, defendant, or subject)?", "declaration.q6");
  if (anyYes(d.q6)) html += fieldGrid([textareaField("declaration.q6.details", "Please state whether Plaintiff/Defendant, the reason, and current status", { span: 2, required: true })]);

  return html;
}

function renderSection_coverage() {
  const plan = currentPlan();
  const isVariable = isVariableLifePlan();
  const isParticipating = isParticipatingPlan();
  const allowsUSD = !!plan && plan.currency === "PESO/USD";

  const planOptions = PLANS.map((p) => p.name);

  const planSummary = plan ? `
    <div class="info-box" style="border-color:#0a3d62;background:#f0f6ff;color:#0a3d62;">
      <strong>${esc(plan.name)}</strong> — ${esc(plan.productLine)}${isParticipating ? " · Participating" : ""}${plan.aaOption === "Y" ? " · Automatic Acceptance eligible" : ""}.
      ${isVariable ? "Fund Allocation (Section VII) is required for this plan." : "Fund Allocation does not apply to this plan."}
    </div>` : `<div class="info-box">Select a Plan to automatically determine currency options, Fund Allocation applicability, Dividend Option eligibility, and Temporary Life Insurance Cover applicability.</div>`;

  return `
    <h2 class="section-title">VI. Life Insurance Coverage Applied For</h2>
    ${fieldGrid([
      selectField("coverage.planName", "Plan Name / Product", planOptions, { required: true, trigger: true }),
    ])}
    ${planSummary}
    ${fieldGrid([
      ...(allowsUSD ? [selectField("coverage.currency", "Currency", ["Php", "USD"], { required: true })] : []),
      numberField("coverage.faceAmount", "Face Amount", { required: true }),
      selectField("coverage.paymentPeriod", "Payment Period", ["Single Pay", "Regular Pay", "Others"], { required: true }),
      selectField("coverage.paymentMode", "Mode of Premium Payment", ["Annual", "Semi-Annual", "Quarterly", "Monthly via Credit Card", "Monthly via ADA", "Others"], { required: true }),
      numberField("coverage.premiumAmount", "Premium Amount", { required: true }),
      ...(isParticipating ? [selectField("coverage.dividendOption", "7. Dividend Option (Participating Policies only)", ["Cash", "Premium Reduction", "Accumulate at Interest", "Paid-Up Additions"])] : []),
      isVariable
        ? selectField("coverage.defaultOption", "8b. Charges Default Option (Variable Life)", ["Charges Deducted from Fund Value", "Automatic Fund Withdrawal"])
        : selectField("coverage.defaultOption", "8a. Premium Default Option (Non-Variable Life)", ["Automatic Premium Loan", "Extended Term Insurance", "Reduced Paid-Up"]),
    ])}
    ${subsectionTitle("6. Riders")}
    <div class="field-grid">
      ${RIDER_OPTIONS.map((r) => checkboxField(`coverage.riders.${r.key}`, r.label)).join("")}
      ${textField("coverage.riders.other", "Other Rider(s)", { span: 2 })}
    </div>
    ${!isParticipating ? `<div class="info-box">Dividend Option does not apply — the selected plan is not Participating.</div>` : ""}
  `;
}

function renderSection_allocation() {
  if (!showAllocationSection()) {
    return `
      <h2 class="section-title">VII. Fund Allocation Instruction</h2>
      <div class="info-box">This section applies only to Variable Life policies. Based on the Plan selected in Section VI, this is not a Variable Life policy, so Fund Allocation is not applicable. You may proceed.</div>
    `;
  }
  const rows = AppState.data.allocation.rows;
  let singleTotal = 0, regularTotal = 0;
  rows.forEach((r) => { singleTotal += Number(r.single) || 0; regularTotal += Number(r.regular) || 0; });

  const tableRows = rows.map((r, idx) => `
    <tr>
      <td><input type="text" data-bind="allocation.rows.${idx}.fund" value="${esc(r.fund)}" /></td>
      <td><input type="number" data-bind="allocation.rows.${idx}.single" value="${esc(r.single)}" /></td>
      <td><input type="number" data-bind="allocation.rows.${idx}.regular" value="${esc(r.regular)}" /></td>
      <td><button type="button" class="row-remove-btn" data-remove-row="allocation.rows|${idx}">Remove</button></td>
    </tr>`).join("");

  return `
    <h2 class="section-title">VII. Fund Allocation Instruction (Variable Life Only)</h2>
    <p class="section-sub">Specify the percentage of premium allocated to each fund. Each column must total exactly 100%.</p>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Fund</th><th>Single Premium (%)</th><th>Regular Premium (%)</th><th></th></tr></thead>
        <tbody>${tableRows}</tbody>
        <tfoot><tr>
          <td><strong>Total</strong></td>
          <td class="allocation-total ${singleTotal === 100 ? "ok" : "bad"}">${singleTotal}%</td>
          <td class="allocation-total ${regularTotal === 100 ? "ok" : "bad"}">${regularTotal}%</td>
          <td></td>
        </tr></tfoot>
      </table>
    </div>
    <button type="button" class="btn btn-secondary btn-small add-row-btn" data-add-row="allocation.rows">+ Add Fund</button>
  `;
}

function renderSection_beneficiaries() {
  const rows = AppState.data.beneficiaries;
  const tableRows = rows.map((r, idx) => {
    const p = `beneficiaries.${idx}`;
    const sexOpts = ["Male", "Female"].map((o) => `<option value="${o}" ${r.sex === o ? "selected" : ""}>${o}</option>`).join("");
    const designationOpts = ["Primary", "Secondary"].map((o) => `<option value="${o}" ${r.designation === o ? "selected" : ""}>${o}</option>`).join("");
    const revocOpts = ["Revocable", "Irrevocable"].map((o) => `<option value="${o}" ${r.revocable === o ? "selected" : ""}>${o}</option>`).join("");
    return `<tr>
      <td><input data-bind="${p}.name" value="${esc(r.name)}" placeholder="Full Name" /></td>
      <td><select data-bind="${p}.sex"><option value="">—</option>${sexOpts}</select></td>
      <td><input data-bind="${p}.relationship" value="${esc(r.relationship)}" /></td>
      <td><input type="date" data-bind="${p}.birthdate" value="${esc(r.birthdate)}" /></td>
      <td><input data-bind="${p}.placeOfBirth" value="${esc(r.placeOfBirth)}" /></td>
      <td><input data-bind="${p}.contactNo" value="${esc(r.contactNo)}" /></td>
      <td><input data-bind="${p}.address" value="${esc(r.address)}" /></td>
      <td><input data-bind="${p}.nationality" value="${esc(r.nationality)}" /></td>
      <td><select data-bind="${p}.designation">${designationOpts}</select></td>
      <td><input type="number" data-bind="${p}.sharePercent" value="${esc(r.sharePercent)}" /></td>
      <td><select data-bind="${p}.revocable">${revocOpts}</select></td>
      <td><button type="button" class="row-remove-btn" data-remove-row="beneficiaries|${idx}">Remove</button></td>
    </tr>`;
  }).join("");

  const primaryTotal = rows.filter((r) => r.designation === "Primary").reduce((s, r) => s + (Number(r.sharePercent) || 0), 0);
  const secondaryTotal = rows.filter((r) => r.designation === "Secondary").reduce((s, r) => s + (Number(r.sharePercent) || 0), 0);

  return `
    <h2 class="section-title">VIII. Designated Beneficiaries</h2>
    <p class="section-sub">Primary beneficiary shares should total 100%; Secondary beneficiary shares should total 100% (if any are named).</p>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Name</th><th>Sex</th><th>Relationship</th><th>Birthdate</th><th>Place of Birth</th>
          <th>Contact No.</th><th>Address</th><th>Nationality</th><th>Designation</th><th>Share %</th><th>Revocable?</th><th></th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    <button type="button" class="btn btn-secondary btn-small add-row-btn" data-add-row="beneficiaries">+ Add Beneficiary</button>
    <p style="margin-top:12px;font-size:12.5px;">
      Primary total: <strong class="${primaryTotal === 100 || primaryTotal === 0 ? "" : "allocation-total bad"}">${primaryTotal}%</strong> &nbsp;|&nbsp;
      Secondary total: <strong class="${secondaryTotal === 100 || secondaryTotal === 0 ? "" : "allocation-total bad"}">${secondaryTotal}%</strong>
    </p>
  `;
}

function renderSection_otherinfo() {
  const o = AppState.data.otherInfo;
  const anyYes = o.beneficialOwnerQ1 === "Yes" || o.beneficialOwnerQ2 === "Yes" || o.beneficialOwnerQ3 === "Yes";
  return `
    <h2 class="section-title">IX. Other Information</h2>
    ${subsectionTitle("Beneficial Owner Determination")}
    ${fieldGrid([
      yesNoField("otherInfo.beneficialOwnerQ1", "Are you entering into this transaction on your own behalf?", { trigger: true }),
      yesNoField("otherInfo.beneficialOwnerQ2", "Will the premiums be funded by someone other than yourself?", { trigger: true }),
      yesNoField("otherInfo.beneficialOwnerQ3", "Will a third party (other than the named beneficiaries) benefit from this policy?", { trigger: true }),
    ])}
    ${anyYes ? reflexCard("beneficialOwner", "Beneficial Owner supplemental details are required.") : ""}

    ${subsectionTitle("Additional Declaration / Special Instructions")}
    ${fieldGrid([
      textareaField("otherInfo.additionalDeclaration", "Additional Declaration (if any)", { span: 2 }),
      textareaField("otherInfo.specialInstructions", "Special Instructions to Head Office (if any)", { span: 2 }),
    ])}
  `;
}

function medicalQuestion(path, label) {
  const answer = val(`${path}.answer`);
  return `${fieldGrid([yesNoField(`${path}.answer`, label, { trigger: true })])}
    ${answer === "Yes" ? fieldGrid([textareaField(`${path}.details`, "Please provide details (condition, dates, treatment, physician, outcome)", { span: 2, required: true })]) : ""}`;
}

const ADULT_MEDICAL_QUESTIONS = [
  ["q3a", "3a. Have you had any surgery, operation, or hospitalization?"],
  ["q3b", "3b. Do you have a heart or blood vessel disorder (e.g., hypertension, heart attack)?"],
  ["q3c", "3c. Do you have a respiratory disorder (e.g., asthma, tuberculosis)?"],
  ["q3d", "3d. Do you have a digestive disorder (e.g., ulcer, liver/gallbladder disease)?"],
  ["q3e", "3e. Do you have a kidney or urinary disorder?"],
  ["q3f", "3f. Do you have diabetes or any endocrine/metabolic disorder?"],
  ["q3g", "3g. Do you have a neurological disorder (e.g., stroke, epilepsy, seizures)?"],
  ["q3h", "3h. Do you have a mental, emotional, or psychiatric disorder?"],
  ["q3i", "3i. Do you have cancer, a tumor, or growth of any kind?"],
  ["q3j", "3j. Do you have a musculoskeletal disorder (e.g., arthritis, back problems)?"],
  ["q3k", "3k. Have you ever tested positive for HIV or been diagnosed with an immune disorder?"],
  ["q3l", "3l. Do you have any other medical condition not mentioned above?"],
  ["q4", "4. Have you used tobacco/nicotine products in the past 12 months?"],
  ["q5", "5. Do you consume alcoholic beverages regularly?"],
  ["q6", "6. Have you ever used prohibited drugs or been treated for substance abuse?"],
  ["q7", "7. Are you currently taking any prescribed medication?"],
  ["q8", "8. Have you had any abnormal diagnostic test result (e.g., ECG, X-ray, laboratory)?"],
  ["q9", "9. Do you have any physical disability or deformity?"],
  ["q10", "10. Has any parent or sibling died of, or been diagnosed with, a hereditary disease before age 60?"],
  ["q11", "11. Have you consulted a physician for any reason not covered above within the last 5 years?"],
];

function renderSection_healthadult() {
  if (!showHealthAdultSection()) {
    const reason = planHasAutomaticAcceptance()
      ? "the selected Plan qualifies for Automatic Acceptance (AA), so no health declaration is required"
      : "no Payor's Death Benefit (PDB) or Payor's Death and Disability Benefit (PDDB) rider applies to the Payor";
    return `
      <h2 class="section-title">X. Health Declaration (Age 16 and above)</h2>
      <div class="info-box">This section does not apply — ${reason}. <em>(Rules BR-009/BR-010/BR-011)</em></div>
    `;
  }
  const subject = healthAdultSubjectLabel();
  const h = AppState.data.healthAdult;
  const effectiveSex = val("insuredSameAsOwner") === "Yes" ? val("policyowner.sex") : val("insured.sex");

  const siblingRows = h.siblings.map((s, idx) => {
    const p = `healthAdult.siblings.${idx}`;
    return `<tr>
      <td><input data-bind="${p}.name" value="${esc(s.name)}" placeholder="Sibling name"/></td>
      <td><input type="number" data-bind="${p}.age" value="${esc(s.age)}" /></td>
      <td><select data-bind="${p}.status"><option ${s.status === "Living" ? "selected" : ""}>Living</option><option ${s.status === "Deceased" ? "selected" : ""}>Deceased</option></select></td>
      <td><input data-bind="${p}.causeOfDeath" value="${esc(s.causeOfDeath)}" placeholder="If deceased, cause"/></td>
      <td><input data-bind="${p}.healthCondition" value="${esc(s.healthCondition)}" placeholder="Known conditions"/></td>
      <td><button type="button" class="row-remove-btn" data-remove-row="healthAdult.siblings|${idx}">Remove</button></td>
    </tr>`;
  }).join("");

  return `
    <h2 class="section-title">X. Health Declaration of ${esc(subject)} (Age 16 and over) or PAYOR (if applying for PDB/PDDB)</h2>
    ${subject === "Payor" ? `<div class="info-box">Because the Policyowner is different from the Life to be Insured and a PDB/PDDB rider is selected, this Health Declaration is answered by the Payor instead of the Life to be Insured. <em>(Rules BR-010/BR-011)</em></div>` : ""}
    ${subsectionTitle("Physical Measurements")}
    ${fieldGrid([
      numberField("healthAdult.height", "Height (cm)", { required: true }),
      numberField("healthAdult.weight", "Weight (kg)", { required: true }),
    ])}

    ${subsectionTitle("Family Medical History")}
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Relation</th><th>Age</th><th>Status</th><th>Cause of Death (if any)</th><th>Known Health Condition</th><th></th></tr></thead>
      <tbody>
        <tr><td>Father</td>
          <td><input type="number" data-bind="healthAdult.father.age" value="${esc(h.father.age)}" /></td>
          <td><select data-bind="healthAdult.father.status"><option ${h.father.status === "Living" ? "selected" : ""}>Living</option><option ${h.father.status === "Deceased" ? "selected" : ""}>Deceased</option></select></td>
          <td><input data-bind="healthAdult.father.causeOfDeath" value="${esc(h.father.causeOfDeath)}" /></td>
          <td><input data-bind="healthAdult.father.healthCondition" value="${esc(h.father.healthCondition)}" /></td>
          <td></td></tr>
        <tr><td>Mother</td>
          <td><input type="number" data-bind="healthAdult.mother.age" value="${esc(h.mother.age)}" /></td>
          <td><select data-bind="healthAdult.mother.status"><option ${h.mother.status === "Living" ? "selected" : ""}>Living</option><option ${h.mother.status === "Deceased" ? "selected" : ""}>Deceased</option></select></td>
          <td><input data-bind="healthAdult.mother.causeOfDeath" value="${esc(h.mother.causeOfDeath)}" /></td>
          <td><input data-bind="healthAdult.mother.healthCondition" value="${esc(h.mother.healthCondition)}" /></td>
          <td></td></tr>
        ${siblingRows}
      </tbody>
    </table></div>
    <button type="button" class="btn btn-secondary btn-small add-row-btn" data-add-row="healthAdult.siblings">+ Add Sibling</button>
    ${h.siblings.length >= SIBLING_SLOTS ? `<div class="info-box" style="margin-top:10px;">More than ${SIBLING_SLOTS} siblings? A supplemental sheet is attached automatically — just keep adding rows.</div>` : ""}

    ${subsectionTitle("Medical History Questions")}
    ${ADULT_MEDICAL_QUESTIONS.map(([key, label]) => medicalQuestion(`healthAdult.questions.${key}`, label)).join("")}

    ${effectiveSex === "Female" ? `
      ${subsectionTitle("Women-Specific Questions")}
      ${medicalQuestion("healthAdult.womenQuestions.pregnant", "Are you currently pregnant?")}
      ${medicalQuestion("healthAdult.womenQuestions.reproductive", "Have you had any gynecological/reproductive health condition?")}
    ` : ""}
  `;
}

const MINOR_MEDICAL_QUESTIONS = [
  ["q1", "1. Was the child born prematurely or with any birth complication?"],
  ["q2", "2. Does the child have any congenital condition or birth defect?"],
  ["q3", "3. Has the child been hospitalized or undergone surgery?"],
  ["q4", "4. Does the child have any developmental, learning, or growth disorder?"],
  ["q5", "5. Is the child currently under any medication or medical treatment?"],
  ["q6", "6. Does the child have any allergies or chronic illness?"],
  ["q7", "7. Has the child had any abnormal diagnostic/laboratory result?"],
];

function renderSection_healthminor() {
  if (!showHealthMinorSection()) {
    return `
      <h2 class="section-title">XI. Health Declaration of Life to be Insured (Below Age 16)</h2>
      <div class="info-box">This section does not apply — the Life to be Insured is 16 years old or above. Section X (Health Declaration, Age 16 and over) applies instead. <em>(Rule BR-013)</em></div>
    `;
  }
  return `
    <h2 class="section-title">XI. Health Declaration of Life to be Insured (Below Age 16)</h2>
    <div class="info-box">This section applies because the Life to be Insured is below 16 years old. It replaces Section X for child applicants. <em>(Rule BR-013)</em></div>
    ${subsectionTitle("Physical Measurements & Birth Details")}
    ${fieldGrid([
      numberField("healthMinor.height", "Height (cm)"),
      numberField("healthMinor.weight", "Weight (kg)"),
      numberField("healthMinor.birthWeight", "Birth Weight (kg)"),
      numberField("healthMinor.gestationWeeks", "Gestation Period (weeks)"),
    ])}
    ${subsectionTitle("Medical History Questions")}
    ${MINOR_MEDICAL_QUESTIONS.map(([key, label]) => medicalQuestion(`healthMinor.questions.${key}`, label)).join("")}
  `;
}

function renderSection_agreement() {
  return `
    <h2 class="section-title">XII. Declaration, Disclosure and Agreement</h2>
    <div class="info-box">
      <strong>Medical Information Database Notice:</strong> Information disclosed may be shared with the MIB and other
      insurers in accordance with applicable law, solely for underwriting and claims purposes.
    </div>
    <div class="info-box">
      <strong>Data Privacy Notice:</strong> Pioneer Life Inc. collects and processes your personal and sensitive
      personal information for policy underwriting, administration, and legally required disclosures, consistent with
      the Data Privacy Act of 2012.
    </div>
    ${checkboxField("agreement.dataPrivacyConsent", "I consent to the collection and processing of my personal and sensitive personal information as described above. *", { span: 2 })}
    ${checkboxField("agreement.marketingOptIn", "I would also like to receive marketing and promotional communications from Pioneer Life Inc. (optional)", { span: 2 })}
    ${checkboxField("agreement.certifyTruth", "I certify that all statements and answers in this application are true, complete, and correctly recorded to the best of my knowledge and belief. *", { span: 2 })}
    ${fieldGrid([
      textField("agreement.place", "Place Signed", { required: true }),
      dateField("agreement.date", "Date Signed", { required: true }),
    ])}
  `;
}

function renderSection_tempcover() {
  if (!showTempCoverOffer()) {
    return `
      <h2 class="section-title">XIII. Temporary Life Insurance Cover Notice</h2>
      <div class="info-box">The Temporary Life Insurance Certificate (TLIC) is <strong>not applicable to Variable Life</strong> plans. Based on the Plan selected in Section VI, this section does not apply. You may proceed. <em>(Rule BR-015)</em></div>
    `;
  }
  const optIn = val("tempCover.optIn");
  return `
    <h2 class="section-title">XIII. Temporary Life Insurance Cover Notice</h2>
    <div class="info-box">
      Subject to the conditions stated in the Temporary Life Insurance Certificate (TLIC), the Life to be Insured may
      be covered temporarily for up to <strong>Php 1,000,000</strong> (maximum aggregate) for a period of
      <strong>45 days</strong> from the date of this application, provided all requirements (including initial premium
      payment and health declarations) are satisfied. This temporary cover is subject to special limitations and does
      not apply if the application is declined, postponed, or the premium is unpaid. The full TLIC will be generated
      with your Review & Submit summary.
    </div>
    ${fieldGrid([yesNoField("tempCover.optIn", "Do you wish to avail of the Temporary Life Insurance Cover while this application is being processed? *", { required: true, trigger: true })])}
    ${optIn === "No" ? `<div class="info-box">No Temporary Life Insurance Certificate will be generated for this application, per your choice above.</div>` : ""}
  `;
}

const ESTATEMENT_TERMS = [
  "The Policyowner consents to receive the policy contract, billing statements, and other notices electronically (\"e-Statement\") instead of, or in addition to, physical mail.",
  "e-Statements will be sent to the email address provided in this application. The Policyowner is responsible for keeping this address updated.",
  "Pioneer Life Inc. is not liable for any delay, non-delivery, or security breach arising from the Policyowner's email service provider or device.",
  "The Policyowner may request a printed copy of any statement at any time, subject to applicable fees, if any.",
  "Enrollment in e-Statement service does not waive any right or obligation under the policy contract.",
  "Pioneer Life Inc. reserves the right to modify, suspend, or discontinue the e-Statement service with prior notice.",
  "The Policyowner may opt out of e-Statement service at any time by written or electronic notice to Pioneer Life Inc.",
  "All electronic communications sent under this service are considered received once transmitted to the registered email address.",
  "The Policyowner agrees to safeguard login credentials, if any, used to access electronic statements.",
  "This agreement is governed by the laws of the Republic of the Philippines and the policy's general provisions.",
];

function renderSection_estatement() {
  return `
    <h2 class="section-title">XIV. Terms and Conditions of e-Statement Service</h2>
    <div class="terms-box">
      <ol>${ESTATEMENT_TERMS.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>
    </div>
    ${checkboxField("estatementTerms.agree", "I have read, understood, and agree to the Terms and Conditions of the e-Statement Service. *", { span: 2 })}
  `;
}

function renderSection_authorization() {
  const derivedMinor = isInsuredMinor();
  const minorSection = derivedMinor === null
    ? `${subsectionTitle("Minor Applicant")}
       <div class="info-box">The Life to be Insured's date of birth has not been entered yet, so minor status cannot be computed automatically. Please confirm directly. <em>(Rules BR-016/BR-017)</em></div>
       ${fieldGrid([yesNoField("authorization.isMinor", "Is the Life to be Insured below 18 years old?", { trigger: true })])}`
    : `${subsectionTitle("Minor Applicant")}
       <div class="info-box">Automatically determined from the Life to be Insured's date of birth: <strong>${derivedMinor ? "Below 18 — a Parent/Guardian signature is required." : "18 or older — signs on their own behalf."}</strong> <em>(Rules BR-016/BR-017)</em></div>`;
  const isMinor = derivedMinor === null ? val("authorization.isMinor") === "Yes" : derivedMinor;
  return `
    <h2 class="section-title">XV. Authorization to Furnish Medical / Other Related Information</h2>
    <div class="info-box">By signing below, you authorize any physician, hospital, insurer, or organization to furnish Pioneer Life Inc. with information regarding your health, insurance, or other relevant records.</div>
    ${subsectionTitle("Policyowner Signature")}
    ${fieldGrid([
      textField("authorization.policyownerSignature", "Policyowner Full Name (typed as signature)", { required: true }),
      dateField("authorization.policyownerDate", "Date", { required: true }),
    ])}
    ${subsectionTitle("Life to be Insured Signature")}
    ${fieldGrid([
      textField("authorization.lifeInsuredSignature", "Life to be Insured Full Name (typed as signature)", { required: true }),
      dateField("authorization.lifeInsuredDate", "Date", { required: true }),
    ])}
    ${minorSection}
    ${isMinor ? fieldGrid([
      textField("authorization.guardianName", "Parent / Guardian Full Name", { required: true }),
      textField("authorization.guardianSignature", "Parent / Guardian Signature (typed)", { required: true }),
      dateField("authorization.guardianDate", "Date", { required: true }),
    ]) : ""}
    ${subsectionTitle("Intermediary / Agent")}
    ${fieldGrid([
      textField("authorization.intermediaryName", "Intermediary / Agent Name"),
      textField("authorization.intermediaryCode", "Agent Code / License Number"),
    ])}
    ${checkboxField("authorization.useThumbmark", "Use thumbmark in lieu of signature (for applicants unable to sign)", { span: 2 })}
  `;
}

/* ---------- Review & Submit ---------- */
function reviewRow(label, value) {
  return `<tr><td class="k">${esc(label)}</td><td class="v">${esc(value) || "—"}</td></tr>`;
}

function reviewGroup(title, stepId, rowsHtml) {
  return `<div class="review-group">
    <div class="review-group-header"><span>${esc(title)}</span>
      <button type="button" class="btn btn-outline btn-small" data-goto-step="${stepId}">Edit</button>
    </div>
    <table class="review-table">${rowsHtml}</table>
  </div>`;
}

function renderSection_review() {
  const s = AppState.data;
  const errors = validateAll();

  let html = `<h2 class="section-title">Review & Submit</h2>
    <p class="section-sub">Please review your application below. Click "Edit" next to any section to make changes.</p>`;

  if (s.submitted) {
    html += `<div class="info-box" style="border-color:#1e8a4c;background:#eaf7ef;color:#1e8a4c;">
      ✔ <strong>Application submitted successfully.</strong> A reference summary and your Temporary Life Insurance Certificate are shown below. Use <strong>Print</strong> to save a PDF copy.
    </div>`;
  } else if (errors.length) {
    html += `<div class="alert-banner">⚠ The following items need attention before you can submit:
      <ul>${errors.map((e) => `<li>${esc(e.message)} <button type="button" class="btn btn-outline btn-small" data-goto-step="${e.stepId}" style="margin-left:6px;">Fix</button></li>`).join("")}</ul>
    </div>`;
  }

  html += reviewGroup("I. Policyowner", "policyowner",
    reviewRow("Name", `${s.policyowner.firstName} ${s.policyowner.lastName}`) +
    reviewRow("Date of Birth", s.policyowner.dob) +
    reviewRow("Mobile No.", s.policyowner.mobileNo) +
    reviewRow("Email", s.policyowner.email));

  const insuredName = s.insuredSameAsOwner === "Yes" ? `${s.policyowner.firstName} ${s.policyowner.lastName} (same as Policyowner)` : `${s.insured.firstName} ${s.insured.lastName}`;
  html += reviewGroup("II. Life to be Insured", "insured", reviewRow("Name", insuredName));

  html += reviewGroup("VI. Coverage", "coverage",
    reviewRow("Plan", s.coverage.planName) +
    reviewRow("Face Amount", s.coverage.faceAmount) +
    reviewRow("Payment Mode", s.coverage.paymentMode) +
    reviewRow("Premium", s.coverage.premiumAmount));

  html += reviewGroup("VIII. Beneficiaries", "beneficiaries",
    s.beneficiaries.map((b) => reviewRow(`${b.designation} — ${b.name || "(unnamed)"}`, `${b.relationship || ""} · ${b.sharePercent || 0}%`)).join(""));

  const qRows = Object.keys(s.questionnaires).map((k) => {
    const q = s.questionnaires[k];
    if (!q.triggered) return "";
    return reviewRow(QUESTIONNAIRES[k].title, q.completed ? "✔ Completed" : "⚠ Not completed yet");
  }).join("");
  if (qRows) html += reviewGroup("Reflexive Questionnaires", "declaration", qRows);

  html += reviewGroup("XII. Agreement", "agreement",
    reviewRow("Data Privacy Consent", s.agreement.dataPrivacyConsent ? "Yes" : "No") +
    reviewRow("Certified True & Complete", s.agreement.certifyTruth ? "Yes" : "No") +
    reviewRow("Place / Date Signed", `${s.agreement.place || ""} / ${s.agreement.date || ""}`));

  html += `<div style="margin-top:22px;">
    <button type="button" id="submitAppBtn" class="btn btn-primary" ${errors.length || s.submitted ? "disabled" : ""}>
      ${s.submitted ? "✔ Submitted" : "Submit Application"}
    </button>
  </div>`;

  if (s.submitted) {
    html += `
    <div class="certificate" style="margin-top:26px;">
      <h3>Temporary Life Insurance Certificate (TLIC)</h3>
      <p style="text-align:center;font-size:12.5px;color:#5b6b7b;">Pioneer Life Inc. · Reference No. TLIC-${Date.now().toString().slice(-8)}</p>
      <table class="review-table">
        ${reviewRow("Life to be Insured", insuredName)}
        ${reviewRow("Maximum Aggregate Cover", "Php 1,000,000")}
        ${reviewRow("Cover Period", "45 days from date of application")}
        ${reviewRow("Date Issued", new Date().toLocaleDateString())}
      </table>
      <p style="font-size:12px;color:#5b6b7b;margin-top:12px;">
        This temporary certificate is subject to the special limitations stated in Section XIII and is superseded by the
        formal policy contract upon approval.
      </p>
    </div>`;
  }

  return html;
}
