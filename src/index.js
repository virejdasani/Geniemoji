// Whenever a letter is entered into the commandInput field, the search() function is executed. With this, matching emojis are displayed as the user is typing
document.getElementById('commandInput').addEventListener('keyup', search)

var searchCommand

function search() {
    // Get the value of the search input
    searchCommand = document.getElementById("commandInput").value.toLowerCase()

    let answerEmojis

    // For each emoji in the emojis.js file, this will search
    emojis.forEach((item) => {
        // This is executed if emojis.keywords (from emojis.js) has the same word as the user input
        if ((item.keywords).includes(searchCommand)) {

            // All the matching emojis are appended into answerEmojis. the '.char' is from the emoji.js file
            answerEmojis += `
                <button type="button" onclick="copy('${item.char}')" id="emojiButton">
                    ${item.char}
                    ${item.name}
                </button>
                </br>
            ` // item.char is the emoji and item.name is the emoji name, both from the emojis.js file
        }
    })

    // If there are no matching emojis, it returns undefined. To not display 'undefined', we do the following
    if (typeof (answerEmojis) !== 'string') {
        answerEmojis = `
            <h3 id="displayedEmojiName">No matching emojis found 😢</h3>
        `
    }

    // answerEmojis returns 'undefined' before all the emojis. This is probably a zero index error but this works for now. Whenever this happens, the code below removes 'undefined' from the answer string
    if (answerEmojis.includes('undefined')) {
        answerEmojis = answerEmojis.replace('undefined', '')
    }

    // Displays all the matching emojis in the answer html div
    document.getElementById('answer').innerHTML = answerEmojis

} // Search function end

// This is to prevent page reload when Enter is pressed in the emoji search bar
document.getElementById('commandInput').addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
        e.preventDefault()
    }
})

// This is executed when an emoji button is pressed
function copy(text) {
    // To copy, a text area is created, the emojiChar is added to the text area. This is then selected and copied. After it is copied, the text area is deleted
    var textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    document.getElementById('answer').innerHTML = `Copied emoji to clipboard!`
}

// TODO
// Make esc hide geniemoji