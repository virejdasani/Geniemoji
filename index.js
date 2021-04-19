// Whenever a letter is entered into the commandInput field, the search() function is executed. With this, matching emojis are displayed as the user is typing
document.getElementById('commandInput').addEventListener('keydown', search)

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
                <button id="emojiColumn">
                    ${item.char}
                    ${item.name}
                </button>
                </br>
            ` // item.char is the emoji and item.name is the emoji name, both from the emojis.js file
        }
    })

    // If there are no matching emojis
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
}

// TODO
// Copy emoji when button is pressed
// Try adding support for arrow keys if not possible, mention somewhere to let users know to use 'tab' to go from one emoji to next