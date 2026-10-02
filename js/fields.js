/* ============================================================
   fields.js — Reusable field-rendering helpers.
   All helpers read current values from AppState.data via `path`
   (dot notation) and emit data-bind attributes so app.js can wire
   change listeners generically.
   ============================================================ */

function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function val(path) {
  const v = getPath(AppState.data, path);
  return v == null ? "" : v;
}

function fieldWrap(path, label, inner, opts = {}) {
  const span = opts.span ? ` span-${opts.span}` : "";
  const hint = opts.hint ? `<span class="hint"> ${esc(opts.hint)}</span>` : "";
  return `<div class="field${span}">
    <label for="f_${path}">${esc(label)}${opts.required ? " *" : ""}${hint}</label>
    ${inner}
  </div>`;
}

function textField(path, label, opts = {}) {
  const type = opts.type || "text";
  return fieldWrap(path, label, `<input type="${type}" id="f_${path}" data-bind="${path}" value="${esc(val(path))}" placeholder="${esc(opts.placeholder || "")}" ${opts.required ? "required" : ""} />`, opts);
}

function numberField(path, label, opts = {}) {
  return fieldWrap(path, label, `<input type="number" id="f_${path}" data-bind="${path}" value="${esc(val(path))}" min="${opts.min != null ? opts.min : 0}" ${opts.required ? "required" : ""} />`, opts);
}

function dateField(path, label, opts = {}) {
  return fieldWrap(path, label, `<input type="date" id="f_${path}" data-bind="${path}" value="${esc(val(path))}" ${opts.required ? "required" : ""} />`, opts);
}

function textareaField(path, label, opts = {}) {
  return fieldWrap(path, label, `<textarea id="f_${path}" data-bind="${path}" rows="${opts.rows || 3}" ${opts.required ? "required" : ""}>${esc(val(path))}</textarea>`, opts);
}

function selectField(path, label, options, opts = {}) {
  const current = val(path);
  const optionTags = [`<option value="">Select…</option>`]
    .concat(options.map((o) => {
      const v2 = typeof o === "string" ? o : o.value;
      const l2 = typeof o === "string" ? o : o.label;
      return `<option value="${esc(v2)}" ${current === v2 ? "selected" : ""}>${esc(l2)}</option>`;
    }));
  const trigger = opts.trigger ? ` data-trigger="true"` : "";
  return fieldWrap(path, label, `<select id="f_${path}" data-bind="${path}"${trigger} ${opts.required ? "required" : ""}>${optionTags.join("")}</select>`, opts);
}

function yesNoField(path, label, opts = {}) {
  const current = val(path) || "";
  const trigger = opts.trigger ? ` data-trigger="true"` : "";
  return fieldWrap(path, label, `
    <div class="yesno" data-bind="${path}"${trigger}>
      <label class="${current === "Yes" ? "selected-yes" : ""}"><input type="radio" name="r_${path}" value="Yes" ${current === "Yes" ? "checked" : ""} /><span>Yes</span></label>
      <label class="${current === "No" ? "selected-no" : ""}"><input type="radio" name="r_${path}" value="No" ${current === "No" ? "checked" : ""} /><span>No</span></label>
    </div>`, opts);
}

function checkboxField(path, label, opts = {}) {
  const checked = !!getPath(AppState.data, path);
  const trigger = opts.trigger ? ` data-trigger="true"` : "";
  return `<div class="field${opts.span ? " span-" + opts.span : ""}">
    <div class="checkbox-row">
      <input type="checkbox" id="f_${path}" data-bind-checkbox="${path}"${trigger} ${checked ? "checked" : ""} />
      <label for="f_${path}">${esc(label)}</label>
    </div>
  </div>`;
}

function fieldGrid(htmlParts) {
  return `<div class="field-grid">${htmlParts.join("")}</div>`;
}

function subsectionTitle(text) {
  return `<h3 class="subsection-title">${esc(text)}</h3>`;
}

/* Reflexive questionnaire trigger card: shows a button + completion marker.
   `questionnaireKey` maps to QUESTIONNAIRES config and state.questionnaires[key]. */
function reflexCard(questionnaireKey, message) {
  const q = AppState.data.questionnaires[questionnaireKey];
  const isDone = q.completed;
  return `<div class="reflex-card" data-questionnaire="${questionnaireKey}">
    <span class="reflex-msg">📝 ${esc(message)}</span>
    <div style="display:flex; align-items:center; gap:10px;">
      <span class="reflex-status ${isDone ? "complete" : "pending"}">${isDone ? "✔ Completed" : "⚠ Action Required"}</span>
      <button type="button" class="btn btn-outline btn-small open-questionnaire-btn" data-open-questionnaire="${questionnaireKey}">
        ${isDone ? "Review / Edit Answers" : "Complete Questionnaire"}
      </button>
    </div>
  </div>`;
}
