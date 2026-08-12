const appVersion = "6.0.0";

const electron = window.require("electron");

const uiStrings = {
  en: {
    placeholder: "Search Emoji",
    help:
      "Use 'Control + E' to summon Geniemoji</br></br>" +
      "Arrow Keys to go up and down</br>" +
      "Enter to type the Emoji</br>" +
      "Shift + Enter to copy the Emoji",
    credit:
      '<a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> is ' +
      'developed by <a href="https://virejdasani.github.io/" target="_blank">Virej Dasani</a>',
    noMatch: "No matching emojis found 😢",
    copied:
      "Copied emoji to clipboard!</br>" +
      "Press Escape to close this window</br></br>",
  },
  es: {
    placeholder: "Buscar emoji",
    help:
      "Usa 'Control + E' para abrir Geniemoji</br></br>" +
      "Flechas para subir y bajar</br>" +
      "Enter para escribir el emoji</br>" +
      "Shift + Enter para copiar el emoji",
    credit:
      '<a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> fue ' +
      'desarrollado por <a href="https://virejdasani.github.io/" target="_blank">Virej Dasani</a>',
    noMatch: "No se encontraron emojis 😢",
    copied:
      "¡Emoji copiado al portapapeles!</br>" +
      "Presiona Escape para cerrar esta ventana</br></br>",
  },
};

let language = "en";
let viewStyle = "list";
var searchCommand;
let currentEmojiLength = 0;

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

// Whenever a letter is entered into the commandInput field, the search() function is executed. With this, matching emojis are displayed as the user is typing
document.getElementById("commandInput").addEventListener("keyup", search);

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

function renderEmojiButton(item, index) {
  const name = emojiName(item);
  const title = escapeAttr(name);
  if (viewStyle === "grid") {
    return `
      <button type="button" onclick="typeEmoji(event, '${item.char}')" class="emojiButton emojiGridButton" title="${title}" tabindex="${index + 2}">
        ${item.char}
      </button>
    `;
  }
  return `
    <button type="button" onclick="typeEmoji(event, '${item.char}')" class="emojiButton" tabindex="${index + 2}">
      ${item.char}
      ${name}
    </button>
    </br>
  `;
}

// To search the emoji that is being inputted
async function search() {
  // Get the value of the search input
  searchCommand = document.getElementById("commandInput").value.toLowerCase();

  let answerEmojis;
  const strings = t();

  const emojis = await electron.ipcRenderer.invoke(
    "getEmojisForSearchString",
    searchCommand
  );
  emojis.forEach((item, i) => {
    currentEmojiLength = i;
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
} // Search function end

// This is to prevent page reload when Enter is pressed in the emoji search bar
document.getElementById("commandInput").addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    e.preventDefault();

    // User has clicked enter, let's automatically click the first item
    document.querySelector('[tabindex="2"]').click();
  }
});

// This is executed when an emoji button is pressed
function typeEmoji(event, text) {
  // Register recent use of emoji
  electron.ipcRenderer.send("selectEmoji", text);

  if (event.shiftKey) {
    // User held down Shift key while selecting this emoji, let's copy it
    copy(text);
  } else {
    // User selected emoji with no Shift key, type out selected emoji
    electron.ipcRenderer.send("typeEmoji", text);
  }
}

// Function to copy text to clipboard
function copy(text) {
  // To copy, a text area is created, the emojiChar is added to the text area. This is then selected and copied. After it is copied, the text area is deleted
  var textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  const strings = t();
  document.getElementById("answer").innerHTML = `
      <div id="info">
        </br>
          ${strings.copied}
          <div id="credit">
          ${strings.credit}
        </div>
      </div>
  `;
}
