const electron = window.require("electron");

const params = new URLSearchParams(window.location.search);
const editTrigger = params.get("trigger") || "";

const strings = {
  en: {
    titleAdd: "Add shortcut",
    titleEdit: "Edit shortcut",
    triggerLabel: "Shortcut name",
    valueLabel: "Text to paste",
    hint: "Type this in Geniemoji search, then press Enter to paste the text below.",
    cancel: "Cancel",
    save: "Save",
    empty: "Both fields are required.",
  },
  es: {
    titleAdd: "Agregar atajo",
    titleEdit: "Editar atajo",
    triggerLabel: "Nombre del atajo",
    valueLabel: "Texto a pegar",
    hint: "Escribe esto en la búsqueda de Geniemoji y pulsa Enter para pegar el texto.",
    cancel: "Cancelar",
    save: "Guardar",
    empty: "Ambos campos son obligatorios.",
  },
};

let language = "en";

function t() {
  return strings[language] || strings.en;
}

function applyStrings() {
  const s = t();
  document.getElementById("title").textContent = editTrigger
    ? s.titleEdit
    : s.titleAdd;
  document.getElementById("triggerLabel").textContent = s.triggerLabel;
  document.getElementById("valueLabel").textContent = s.valueLabel;
  document.getElementById("hint").textContent = s.hint;
  document.getElementById("cancelBtn").textContent = s.cancel;
  document.getElementById("saveBtn").textContent = s.save;
}

async function init() {
  language = await electron.ipcRenderer.invoke("getLanguage");
  applyStrings();

  if (editTrigger) {
    const shortcuts = await electron.ipcRenderer.invoke("getTextShortcuts");
    const match = shortcuts.find(
      (item) => item.trigger.toLowerCase() === editTrigger.toLowerCase()
    );
    if (match) {
      document.getElementById("triggerInput").value = match.trigger;
      document.getElementById("valueInput").value = match.value;
    }
  }

  document.getElementById("triggerInput").focus();
}

function save() {
  const trigger = document.getElementById("triggerInput").value.trim();
  const value = document.getElementById("valueInput").value;
  const errorEl = document.getElementById("error");

  if (!trigger || !value.trim()) {
    errorEl.textContent = t().empty;
    return;
  }

  electron.ipcRenderer.send("saveTextShortcut", {
    trigger,
    value,
    previousTrigger: editTrigger || null,
  });
}

document.getElementById("saveBtn").addEventListener("click", save);
document.getElementById("cancelBtn").addEventListener("click", () => {
  electron.ipcRenderer.send("closeShortcutWindow");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    electron.ipcRenderer.send("closeShortcutWindow");
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    save();
  }
});

init();
