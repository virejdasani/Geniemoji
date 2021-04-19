var searchCommand

// This is executed when the ask button is pressed
document.getElementById("showAnswer").addEventListener("click", function (event) {
    // This prevents refresh
    event.preventDefault()

    // Get the value of the search input
    searchCommand = document.getElementById("commandInput").value.toLowerCase()

    let answerEmojis

    // For each emoji in the emojis.js file, this will search
    emojis.forEach((item) => {
        // This is executed if emojis.keywords (from emojis.js) has the same word as the user input
        if ((item.keywords).includes(searchCommand)) {

            // All the matching emojis are appended into answerEmojis
            answerEmojis += item.char;
        }
    })

    // If there are no matching emojis
    if (typeof(answerEmojis) !== 'string') {
        answerEmojis = 'No matching emojis found 😢'
        console.log('if')
        typeof(answerEmojis)
    }

    // answerEmojis returns 'undefined' before all the emojis. This is probably a zero index error but this works for now. Whenever this happens, the code below removes 'undefined' from the answer string
    if (answerEmojis.includes('undefined')) {
        answerEmojis = answerEmojis.replace('undefined', '')
    }

    // Displays all the matching emojis in the answer html div
    document.getElementById('answer').innerHTML = answerEmojis

}) 
// TODO - make it hot reload instead of showing results when enter is pressed