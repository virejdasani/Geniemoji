var appVersion = "6.0.0";

const electron = window.require("electron");

const GRID_COLUMNS = 8;

const uiStrings = {
  en: {
    placeholder: "Search Emoji",
    help:
      "Use 'Control + E' to summon Geniemoji</br></br>" +
      "Arrow Keys to navigate</br>" +
      "Enter to type the Emoji</br>" +
      "Escape to close",
    credit:
      '<a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> is ' +
      'developed by <a href="https://virejdasani.github.io/virej/" target="_blank">Virej Dasani</a>',
    noMatch: "No matching emojis found 😢",
  },
  es: {
    placeholder: "Buscar emoji",
    help:
      "Usa 'Control + E' para abrir Geniemoji</br></br>" +
      "Flechas para navegar</br>" +
      "Enter para escribir el emoji</br>" +
      "Escape para cerrar",
    credit:
      '<a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> fue ' +
      'desarrollado por <a href="https://virejdasani.github.io/virej/" target="_blank">Virej Dasani</a>',
    noMatch: "No se encontraron emojis 😢",
  },
};

let language = "en";
let viewStyle = "list";
var searchCommand;
let currentEmojis = [];
let selectedIndex = 0;

function t() {
  return uiStrings[language] || uiStrings.en;
}

function emojiName(item) {
  if (language === "es") {
    return item.name_es || item.name;
  }
  return item.name;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function refreshView() {
  const strings = t();
  const input = document.getElementById("commandInput");
  input.placeholder = strings.placeholder;
  document.body.classList.toggle("view-grid", viewStyle === "grid");
  document.body.classList.toggle("view-list", viewStyle !== "grid");

  if (input.value) {
    search();
  } else {
    currentEmojis = [];
    selectedIndex = 0;
    document.getElementById("answer").innerHTML = `
      <div id="info">
        ${strings.help}
      </div>
      <div id="credit">
        ${strings.credit}
      </div>
    `;
  }
}

function applyLanguage(nextLanguage) {
  language = nextLanguage === "es" ? "es" : "en";
  refreshView();
}

function applyViewStyle(nextViewStyle) {
  viewStyle = nextViewStyle === "grid" ? "grid" : "list";
  refreshView();
}

function focusSearchInput() {
  const input = document.getElementById("commandInput");
  if (input) input.focus();
}

function applySelectionHighlight() {
  const buttons = document.querySelectorAll(".emojiButton");
  buttons.forEach((button, index) => {
    button.classList.toggle("selected", index === selectedIndex);
  });
  const selected = buttons[selectedIndex];
  if (selected) {
    selected.scrollIntoView({ block: "nearest" });
  }
}

function selectEmojiAt(index) {
  if (!currentEmojis.length) return;
  const max = currentEmojis.length - 1;
  selectedIndex = Math.max(0, Math.min(max, index));
  applySelectionHighlight();
  focusSearchInput();
}

function moveSelection(delta) {
  if (!currentEmojis.length) return;
  const max = currentEmojis.length;
  selectedIndex = (selectedIndex + delta + max) % max;
  applySelectionHighlight();
  focusSearchInput();
}

function moveSelectionVertical(direction) {
  if (!currentEmojis.length) return;
  if (viewStyle === "grid") {
    selectEmojiAt(selectedIndex + direction * GRID_COLUMNS);
  } else {
    moveSelection(direction);
  }
}

// Search as the user types. Use 'input' (not keyup) so arrow-key navigation does not reset selection.
document.getElementById("commandInput").addEventListener("input", search);

Promise.all([
  electron.ipcRenderer.invoke("getLanguage"),
  electron.ipcRenderer.invoke("getViewStyle"),
]).then(([nextLanguage, nextViewStyle]) => {
  language = nextLanguage === "es" ? "es" : "en";
  viewStyle = nextViewStyle === "grid" ? "grid" : "list";
  refreshView();
});

electron.ipcRenderer.on("language-changed", (_event, nextLanguage) => {
  applyLanguage(nextLanguage);
});
electron.ipcRenderer.on("view-style-changed", (_event, nextViewStyle) => {
  applyViewStyle(nextViewStyle);
});

// For app update, if an update is available, the updateAvailable in the RemoteJSON repo will be updated to yes. That will result in the code below being executed
fetch("https://virejdasani.github.io/RemoteJSON/Geniemoji/index.html")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    // If update is available, and this version is not the latest one, the update div will no longer be empty. It will have the following HTML
    if (data.updateAvailable == "yes" && data.latestVersion != appVersion) {
      document.getElementById("update").innerHTML = `
                <div id="update">
                    ${data.updateText}
                    Download update <!-- (${data.latestVersion}) --> <a href="${data.updateURL}" target="_blank">here</a>
                </div>
            `;
    }
  })
  .catch((err) => {
    // console.log(err)
  });

// Windows Segoe UI Emoji does not draw country flags (shows "MX", "US", etc.).
// Render those with Twemoji images in the UI; clipboard still gets the real emoji.
function isFlagEmoji(item) {
  const codes = item.codes.split(" ");
  if (codes.length === 2) {
    const a = parseInt(codes[0], 16);
    const b = parseInt(codes[1], 16);
    return (
      a >= 0x1f1e6 &&
      a <= 0x1f1ff &&
      b >= 0x1f1e6 &&
      b <= 0x1f1ff
    );
  }
  // England / Scotland / Wales tag sequences
  return codes[0] === "1F3F4" && codes.some((c) => c.startsWith("E00"));
}

function flagImageHtml(item) {
  const hex = item.codes.split(" ").map((c) => c.toLowerCase()).join("-");
  const src = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/${hex}.png`;
  return `<img class="emojiFlag" src="${src}" alt="${item.char}" draggable="false">`;
}

function emojiDisplayHtml(item) {
  return isFlagEmoji(item) ? flagImageHtml(item) : item.char;
}

function renderEmojiButton(item, index) {
  const name = emojiName(item);
  const title = escapeAttr(name);
  const selectedClass = index === selectedIndex ? " selected" : "";
  if (viewStyle === "grid") {
    return `
      <button type="button" onclick="typeEmoji('${item.char}')" class="emojiButton emojiGridButton${selectedClass}" title="${title}" data-index="${index}" tabindex="-1">
        ${emojiDisplayHtml(item)}
      </button>
    `;
  }
  return `
    <button type="button" onclick="typeEmoji('${item.char}')" class="emojiButton${selectedClass}" data-index="${index}" tabindex="-1">
      ${emojiDisplayHtml(item)}
      ${name}
    </button>
    </br>
  `;
}

async function search() {
  // Get the value of the search input
  searchCommand = document.getElementById("commandInput").value.toLowerCase();

  let answerEmojis;
  const strings = t();

  const emojis = await electron.ipcRenderer.invoke(
    "getEmojisForSearchString",
    searchCommand
  );
  currentEmojis = emojis;
  selectedIndex = 0;
  emojis.forEach((item, i) => {
    answerEmojis += renderEmojiButton(item, i);
  });

  // If there are no matching emojis, it returns undefined. To not display 'undefined', we do the following
  if (typeof answerEmojis !== "string") {
    answerEmojis = `
            <h3 id="displayedEmojiName">${strings.noMatch}</h3>
            <div id="credit">
              ${strings.credit}
            </div>
        `;
  } else if (viewStyle === "grid") {
    answerEmojis = `<div class="emojiGrid">${answerEmojis}</div>`;
  }

  // answerEmojis returns 'undefined' before all the emojis. This is probably a zero index error but this works for now. Whenever this happens, the code below removes 'undefined' from the answer string
  if (answerEmojis.includes("undefined")) {
    answerEmojis = answerEmojis.replace("undefined", "");
  }

  // Displays all the matching emojis in the answer html div
  document.getElementById("answer").innerHTML = answerEmojis;
  focusSearchInput();
} // Search function end

// Enter types the highlighted emoji, copies it, and closes Geniemoji
document.getElementById("commandInput").addEventListener("keydown", (e) => {
  if (e.code === "Enter" || e.code === "NumpadEnter") {
    e.preventDefault();
    if (!currentEmojis.length) return;
    const emoji = currentEmojis[selectedIndex];
    if (!emoji) return;
    typeEmoji(emoji.char);
  }
});

function typeEmoji(text) {
  electron.ipcRenderer.send("selectEmoji", text);
  electron.ipcRenderer.send("typeEmoji", text);
}

// Arrow keys move selection highlight without leaving the search input
document.addEventListener("keydown", (event) => {
  if (
    event.code !== "ArrowDown" &&
    event.code !== "ArrowUp" &&
    event.code !== "ArrowLeft" &&
    event.code !== "ArrowRight"
  ) {
    return;
  }
  if (!currentEmojis.length) return;

  event.preventDefault();

  if (event.code === "ArrowRight") {
    moveSelection(1);
  } else if (event.code === "ArrowLeft") {
    moveSelection(-1);
  } else if (event.code === "ArrowDown") {
    moveSelectionVertical(1);
  } else if (event.code === "ArrowUp") {
    moveSelectionVertical(-1);
  }
});
