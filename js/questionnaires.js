/* ============================================================
   questionnaires.js — Reflexive questionnaire modal engine.
   Implements the user's requested pattern: when a risk question
   is answered "Yes", a button appears; clicking it opens a modal
   questionnaire. Submitting marks a completion flag
   (state.questionnaires[key].completed) that gates progression.
   ============================================================ */

const Questionnaire = {
  activeKey: null,

  open(key) {
    const config = QUESTIONNAIRES[key];
    if (!config) return;
    this.activeKey = key;
    AppState.data.questionnaires[key].triggered = true;

    document.getElementById("modalTitle").textContent = config.title;
    document.getElementById("modalHint").textContent = "* Required fields";

    const fieldsHtml = config.fields.map((f) => {
      const path = `questionnaires.${key}.data.${f.key}`;
      const opts = { required: !!f.required, span: f.type === "textarea" ? 2 : 1 };
      switch (f.type) {
        case "textarea": return textareaField(path, f.label, opts);
        case "number": return numberField(path, f.label, opts);
        case "date": return dateField(path, f.label, opts);
        case "select": return selectField(path, f.label, f.options, opts);
        case "yesno": return yesNoField(path, f.label, opts);
        default: return textField(path, f.label, opts);
      }
    });

    document.getElementById("modalBody").innerHTML =
      `<p class="section-sub" style="margin-top:-4px;">${esc(config.intro)}</p>` +
      fieldGrid(fieldsHtml);

    const modalRoot = document.getElementById("modalRoot");
    modalRoot.classList.remove("hidden");
    bindContainerEvents(document.getElementById("modalBody"));
  },

  close() {
    document.getElementById("modalRoot").classList.add("hidden");
    this.activeKey = null;
  },

  save() {
    if (!this.activeKey) return;
    const key = this.activeKey;
    const config = QUESTIONNAIRES[key];
    const modalBody = document.getElementById("modalBody");

    // Validate required fields within the modal
    let firstInvalid = null;
    config.fields.forEach((f) => {
      if (!f.required) return;
      const path = `questionnaires.${key}.data.${f.key}`;
      const value = getPath(AppState.data, path);
      const el = modalBody.querySelector(`[id="f_${path}"], [data-bind="${path}"]`);
      const empty = value === "" || value == null;
      if (el) el.classList.toggle("invalid", empty);
      if (empty && !firstInvalid) firstInvalid = f.label;
    });

    if (firstInvalid) {
      document.getElementById("modalHint").textContent = `⚠ Please complete: ${firstInvalid}`;
      document.getElementById("modalHint").style.color = "#c0392b";
      return;
    }

    AppState.data.questionnaires[key].completed = true;
    AppState.persist();
    this.close();
    renderCurrentStep();
  },
};

function openQuestionnaireFromTrigger(key) {
  Questionnaire.open(key);
}
