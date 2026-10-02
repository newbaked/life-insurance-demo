/* ============================================================
   app.js — Main controller: navigation, rendering orchestration,
   generic event binding, and persistence actions (save/load/print).
   ============================================================ */

const SECTION_RENDERERS = {
  start: renderSection_start,
  policyowner: renderSection_policyowner,
  insured: renderSection_insured,
  history: renderSection_history,
  replacement: renderSection_replacement,
  declaration: renderSection_declaration,
  coverage: renderSection_coverage,
  allocation: renderSection_allocation,
  beneficiaries: renderSection_beneficiaries,
  otherinfo: renderSection_otherinfo,
  healthadult: renderSection_healthadult,
  healthminor: renderSection_healthminor,
  agreement: renderSection_agreement,
  tempcover: renderSection_tempcover,
  estatement: renderSection_estatement,
  authorization: renderSection_authorization,
  review: renderSection_review,
};

const ROW_FACTORIES = {
  "history.ownPolicies": createEmptyHistoryRow,
  "history.parentsSiblings": () => ({ relationship: "", name: "", age: "", insuranceCompany: "", amountInForce: "" }),
  "allocation.rows": () => ({ fund: "", single: "", regular: "" }),
  "beneficiaries": createEmptyBeneficiaryRow,
  "healthAdult.siblings": createEmptyFamilyMember,
};

function currentStep() { return FORM_STEPS[AppState.currentStepIndex]; }

function clearAlert() {
  const banner = document.getElementById("alertBanner");
  banner.classList.add("hidden");
  banner.innerHTML = "";
}

function showAlert(messages) {
  const banner = document.getElementById("alertBanner");
  banner.innerHTML = `⚠ Please resolve the following before continuing:<ul>${messages.map((m) => `<li>${esc(m.message || m)}</li>`).join("")}</ul>`;
  banner.classList.remove("hidden");
  banner.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderStepNav() {
  const list = document.getElementById("stepList");
  list.innerHTML = FORM_STEPS.map((step, idx) => {
    const isActive = idx === AppState.currentStepIndex;
    const isDone = idx < AppState.maxReachedIndex;
    const isLocked = idx > AppState.maxReachedIndex;
    const classes = ["", isActive ? "active" : "", isDone ? "done" : "", isLocked ? "locked" : ""].join(" ").trim();
    return `<li class="${classes}" data-goto-index="${idx}">
      <span class="step-dot">${isDone ? "✓" : idx + 1}</span>
      <span>${esc(step.label)}</span>
    </li>`;
  }).join("");

  const pct = Math.round((AppState.maxReachedIndex / (FORM_STEPS.length - 1)) * 100);
  document.getElementById("overallProgressFill").style.width = `${Math.min(pct, 100)}%`;
  document.getElementById("overallProgressLabel").textContent = `${Math.min(pct, 100)}% complete`;
}

function renderCurrentStep() {
  clearAlert();
  const step = currentStep();
  const renderer = SECTION_RENDERERS[step.id];
  const content = document.getElementById("stepContent");
  content.innerHTML = renderer ? renderer() : `<p>Unknown section.</p>`;
  bindContainerEvents(content);
  renderStepNav();

  document.getElementById("stepIndicator").textContent = `Step ${AppState.currentStepIndex + 1} of ${FORM_STEPS.length}`;
  document.getElementById("prevBtn").disabled = AppState.currentStepIndex === 0;

  const nextBtn = document.getElementById("nextBtn");
  if (step.id === "review") {
    nextBtn.classList.add("hidden");
  } else {
    nextBtn.classList.remove("hidden");
    nextBtn.textContent = AppState.currentStepIndex === FORM_STEPS.length - 2 ? "Go to Review →" : "Continue →";
  }
}

function gotoStepIndex(idx) {
  if (idx < 0 || idx >= FORM_STEPS.length) return;
  AppState.currentStepIndex = idx;
  AppState.persist();
  renderCurrentStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function gotoStepId(id) {
  const idx = FORM_STEPS.findIndex((s) => s.id === id);
  if (idx >= 0) gotoStepIndex(idx);
}

/* ---------- Generic field-event binding (shared by step content & modal) ---------- */
function bindContainerEvents(container) {
  container.addEventListener("input", onFieldEvent);
  container.addEventListener("change", onFieldEvent);
  container.addEventListener("click", onContainerClick);
}

function onFieldEvent(e) {
  const target = e.target;

  const checkboxEl = target.closest("[data-bind-checkbox]");
  if (checkboxEl) {
    const path = checkboxEl.getAttribute("data-bind-checkbox");
    setPath(AppState.data, path, target.checked);
    AppState.persist();
    if (checkboxEl.hasAttribute("data-trigger")) renderCurrentStep();
    return;
  }

  const bindEl = target.closest("[data-bind]");
  if (bindEl) {
    const path = bindEl.getAttribute("data-bind");
    const value = target.value;
    setPath(AppState.data, path, value);
    AppState.persist();
    target.classList.remove("invalid");

    // Live totals for allocation / beneficiaries without losing input focus
    if (path.startsWith("allocation.rows.")) { updateAllocationTotals(); return; }
    if (path.startsWith("beneficiaries.")) { updateBeneficiaryTotals(); return; }

    if (bindEl.hasAttribute("data-trigger")) {
      renderCurrentStep();
    }
  }
}

function updateAllocationTotals() {
  const content = document.getElementById("stepContent");
  const rows = AppState.data.allocation.rows;
  const singleTotal = rows.reduce((s, r) => s + (Number(r.single) || 0), 0);
  const regularTotal = rows.reduce((s, r) => s + (Number(r.regular) || 0), 0);
  const cells = content.querySelectorAll(".allocation-total");
  if (cells[0]) { cells[0].textContent = `${singleTotal}%`; cells[0].className = `allocation-total ${singleTotal === 100 ? "ok" : "bad"}`; }
  if (cells[1]) { cells[1].textContent = `${regularTotal}%`; cells[1].className = `allocation-total ${regularTotal === 100 ? "ok" : "bad"}`; }
}

function updateBeneficiaryTotals() {
  // Simplest reliable approach for a modest-size table: re-render just this step.
  renderCurrentStep();
}

function onContainerClick(e) {
  const openBtn = e.target.closest("[data-open-questionnaire]");
  if (openBtn) { Questionnaire.open(openBtn.getAttribute("data-open-questionnaire")); return; }

  const addBtn = e.target.closest("[data-add-row]");
  if (addBtn) {
    const path = addBtn.getAttribute("data-add-row");
    const arr = getPath(AppState.data, path);
    const factory = ROW_FACTORIES[path];
    arr.push(factory ? factory() : {});
    AppState.persist();
    renderCurrentStep();
    return;
  }

  const removeBtn = e.target.closest("[data-remove-row]");
  if (removeBtn) {
    const [path, idxStr] = removeBtn.getAttribute("data-remove-row").split("|");
    const arr = getPath(AppState.data, path);
    arr.splice(Number(idxStr), 1);
    AppState.persist();
    renderCurrentStep();
    return;
  }

  const gotoBtn = e.target.closest("[data-goto-step]");
  if (gotoBtn) { gotoStepId(gotoBtn.getAttribute("data-goto-step")); return; }

  if (e.target.id === "submitAppBtn") {
    const errors = validateAll();
    if (errors.length) { showAlert(errors); return; }
    AppState.data.submitted = true;
    AppState.persist();
    renderCurrentStep();
  }
}

/* ---------- Top-level wiring ---------- */
function initApp() {
  const hadSaved = AppState.loadFromStorage();
  if (!hadSaved) AppState.persist();

  renderCurrentStep();

  document.getElementById("stepList").addEventListener("click", (e) => {
    const li = e.target.closest("[data-goto-index]");
    if (!li) return;
    const idx = Number(li.getAttribute("data-goto-index"));
    if (idx > AppState.maxReachedIndex) {
      showAlert([{ message: "Please complete the current section before jumping ahead." }]);
      return;
    }
    gotoStepIndex(idx);
  });

  document.getElementById("prevBtn").addEventListener("click", () => {
    if (AppState.currentStepIndex > 0) gotoStepIndex(AppState.currentStepIndex - 1);
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    const step = currentStep();
    const errors = validateStep(step.id);
    if (errors.length) { showAlert(errors); return; }
    AppState.maxReachedIndex = Math.max(AppState.maxReachedIndex, AppState.currentStepIndex + 1);
    AppState.persist();
    if (AppState.currentStepIndex < FORM_STEPS.length - 1) gotoStepIndex(AppState.currentStepIndex + 1);
  });

  // Modal wiring
  document.getElementById("modalCloseBtn").addEventListener("click", () => Questionnaire.close());
  document.getElementById("modalCancelBtn").addEventListener("click", () => Questionnaire.close());
  document.getElementById("modalBackdrop").addEventListener("click", () => Questionnaire.close());
  document.getElementById("modalSaveBtn").addEventListener("click", () => Questionnaire.save());

  // Header actions
  document.getElementById("saveBtn").addEventListener("click", () => {
    const blob = new Blob([AppState.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pioneer-life-application-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("loadBtn").addEventListener("click", () => {
    document.getElementById("loadFileInput").click();
  });

  document.getElementById("loadFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        AppState.loadFromObject(obj);
        AppState.maxReachedIndex = FORM_STEPS.length - 1;
        renderCurrentStep();
      } catch (err) {
        alert("Could not read this file. Please select a valid exported application JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("printBtn").addEventListener("click", () => printApplication());

  document.getElementById("restartBtn").addEventListener("click", () => {
    if (confirm("This will clear all entered data and start a new application. Continue?")) {
      AppState.reset();
      renderCurrentStep();
    }
  });
}

document.addEventListener("DOMContentLoaded", initApp);
