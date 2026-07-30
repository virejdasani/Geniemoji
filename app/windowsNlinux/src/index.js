var appVersion = "6.0.0";

const electron = window.require("electron");

const uiStrings = {
  en: {
    placeholder: "Search Emoji",
    help:
      "Use 'Control + E' to summon Geniemoji</br></br>" +
      "Arrow Keys to go up and down</br>" +
      "Enter to copy the Emoji",
    credit:
      '<a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> is ' +
      'developed by <a href="https://virejdasani.github.io/virej/" target="_blank">Virej Dasani</a>',
    noMatch: "No matching emojis found 😢",
    copied:
      "Copied emoji to clipboard!</br></br>" +
      "Press Escape to close this window</br></br>",
  },
  es: {
    placeholder: "Buscar emoji",
    help:
      "Usa 'Control + E' para abrir Geniemoji</br></br>" +
      "Flechas para subir y bajar</br>" +
      "Enter para copiar el emoji",
    credit:
      '<a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> fue ' +
      'desarrollado por <a href="https://virejdasani.github.io/virej/" target="_blank">Virej Dasani</a>',
    noMatch: "No se encontraron emojis 😢",
    copied:
      "¡Emoji copiado al portapapeles!</br></br>" +
      "Presiona Escape para cerrar esta ventana</br></br>",
  },
};

let language = "en";
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

function applyLanguage(nextLanguage) {
  language = nextLanguage === "es" ? "es" : "en";
  const strings = t();
  const input = document.getElementById("commandInput");
  input.placeholder = strings.placeholder;

  // Refresh current view: search results or idle help text
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

// Whenever a letter is entered into the commandInput field, the search() function is executed. With this, matching emojis are displayed as the user is typing
document.getElementById("commandInput").addEventListener("keyup", search);

electron.ipcRenderer.invoke("getLanguage").then(applyLanguage);
electron.ipcRenderer.on("language-changed", (_event, nextLanguage) => {
  applyLanguage(nextLanguage);
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
    // All the matching emojis are appended into answerEmojis. the '.char' is from the emoji.js file
    answerEmojis += `
                <button type="button" onclick="copy('${
                  item.char
                }')" class="emojiButton" tabindex="${i + 2}">
                    ${emojiDisplayHtml(item)}
                    ${emojiName(item)}
                </button>
                </br>
            `; // item.char is the emoji and item.name is the emoji name, both from the emojis.js file
  });

  // If there are no matching emojis, it returns undefined. To not display 'undefined', we do the following
  if (typeof answerEmojis !== "string") {
    answerEmojis = `
            <h3 id="displayedEmojiName">${strings.noMatch}</h3>
            <div id="credit">
              ${strings.credit}
            </div>
        `;
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

    // User has clicked enter, let's autoclick the first item
    document.querySelector('[tabindex="2"]').click();
  }
});

// This is executed when an emoji button is pressed
function copy(text) {
  // Register recent use of emoji
  electron.ipcRenderer.send("selectEmoji", text);

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

// For arrow key navigation
document.addEventListener("keydown", (event) => {
  // Key is ArrowUp or ArrowDown?
  if (event.code === "ArrowDown" || event.code === "ArrowUp") {
    event.preventDefault();
    // get tabIndex of current element
    let tabIndex = event.target.tabIndex;
    // increment or decrement tabindex depending on Key (ArrowUp -> previous Element, ArrowDown -> next lement)
    tabIndex += event.code === "ArrowUp" ? -1 : 1;
    // circle through emojis
    // ArrowUp and focus on input field? -> select last emoji
    if (tabIndex < 1) {
      tabIndex = currentEmojiLength + 2; // '+2': tabIndex starts with 1, 1 = input
    }
    // ArrowDown and focus on last emoji? -> select input field
    if (tabIndex > currentEmojiLength + 2) {
      tabIndex = 1;
    }
    // get element with newly calculated tabindex
    const newEl = document.querySelector(`[tabindex="${tabIndex}"]`);
    // set focus on element to select
    newEl.focus();
  }
});
