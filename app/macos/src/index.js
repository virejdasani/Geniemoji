var appVersion = "5.0.0";

const electron = window.require("electron");

// Whenever a letter is entered into the commandInput field, the search() function is executed. With this, matching emojis are displayed as the user is typing
document.getElementById("commandInput").addEventListener("keyup", search);

var searchCommand;
let currentEmojiLength = 0;

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

async function search() {
  // Get the value of the search input
  searchCommand = document.getElementById("commandInput").value.toLowerCase();

  let answerEmojis;

  const emojis = await electron.ipcRenderer.invoke("getEmojisForSearchString", searchCommand);
  emojis.forEach((item, i) => {
      currentEmojiLength = i;
      // All the matching emojis are appended into answerEmojis. the '.char' is from the emoji.js file
      answerEmojis += `
                <button type="button" onclick="typeEmoji(event, '${
                  item.char
                }')" class="emojiButton" tabindex="${i + 2}">
                    ${item.char}
                    ${item.name}
                </button>
                </br>
            `; // item.char is the emoji and item.name is the emoji name, both from the emojis.js file
    });

  // If there are no matching emojis, it returns undefined. To not display 'undefined', we do the following
  if (typeof answerEmojis !== "string") {
    answerEmojis = `
            <h3 id="displayedEmojiName">No matching emojis found 😢</h3>
            <div id="credit">
              <a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> is
              developed by <a href="https://virejdasani.github.io/" target="_blank">Virej Dasani</a>
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
  document.getElementById("answer").innerHTML = `
        <div id="info">
          </br>
            Copied emoji to clipboard!</br>
            Press Escape to close this window</br></br>
            <div id="credit">
            <a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> is
            developed by <a href="https://virejdasani.github.io/" target="_blank">Virej Dasani</a>
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
