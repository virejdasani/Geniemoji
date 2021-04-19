// This is executed when the ask button is pressed
document.getElementById("askBtn").addEventListener("click", function(event){
    // This prevents refresh
    event.preventDefault()

    // Variable declaration
    let command
    let answer

    // LISTS
    // Inputs
    let agreeInput = ["yes", "y", "sure", "yep"]
    let disagreeInput = ["no", "n", "nope"]

    // Responses
    let helloResponse = ["Hello to you too!", "Hey!", "Good to see you!", "Hi, nice to meet you"] 
    let howAreYouResponse = ["Just doing my thing!", "I am great!", "Amazing!", "Feeling awesome!"]
    let whatsUpResponse = ["The ceiling, the sky?", "Nothing much, just robot butler stuff...", "Just personal assistant stuff..."]
    let agreeResponse = ["Sure thing", "Okay", "For sure", "Alright", "Here you go"]        
    let unrecognisedCommandResponse = ["Sorry, I don't know that. <div>Type 'help' to see what I can do</div>", "I'm not too sure about that one. <div>Type 'help' to see what I can do</div>", "Hmm, I'm not sure I know that yet. <div>Type 'help' to see what I can do</div>"]
    let exitResponse = ["Goodbye", "Bye Bye!", "See you soon", "Catch you later!"]
    let errorResponse = ["An error occured", "Sorry, there was an error", "Error, try again"]

  
    // This gets the value that user has inputted
    command = document.getElementById("commandInput").value.toLowerCase()

    // ADD POSSIBLE USER COMMANDS HERE
    // GENERAL
    if (command === "") { // If user presses askBtn and text field is empty
        answer = "Type 'Help' to see what I can do"
    }

    else if (command === "hi" || command.includes("hey") || command.includes("hello") || command.includes("hii")) {
        answer = random(helloResponse)
    }

    else if (command.includes("how are you") || command.includes("hows it going") || command.includes("how's it going") || command.includes("how r u")) {
        answer = random(howAreYouResponse)
    }

    else if (command.includes("whats up") || command.includes("what's up") || command.includes("ssup") || command.includes("what up")) {
        answer = random(whatsUpResponse)
    }
            
    else if (command.includes("who are you") || command.includes("what are you") || command.includes("what r u") || command.includes("who r u")) {
        answer = "I am Cadbury, your personal robot butler! Type 'help' to see what I can do!"
    }

    // WEB BASED COMMANDS
    // To open an external website
    else if (command.includes("open ")) {

        if (command.includes("stack overflow") || command.includes("stovf")) {
            openSite('https://stackoverflow.com')
            answer = random(agreeResponse)
        }

        else if (command.includes("youtube") || command.includes(" yt")) {
            openSite('https://youtube.com')
            answer = random(agreeResponse)
        }
        
        else if (command.includes("github") || command.includes(" gh")) {
            openSite('https://github.com')
            answer = random(agreeResponse)
        }

        else if (command.includes("google")) {
            openSite('https://google.com')
            answer = random(agreeResponse)
        }
        
        else {
        	if (command.includes("www") || command.includes("http") || command.includes(".com")) {
                let site = command.slice(5)
                answer = random(agreeResponse) + ", opening '" + command.slice(5) + "'"
                // https:// is required to open the site
                if (command.includes("http")) {
                    openSite(site)
                }
                else {
                    openSite("https://" + site)
                    answer = random(agreeResponse) + ", opening 'https://" + command.slice(5) + "'"
                }

            }
        }

    }
    
    else {
        answer = random(unrecognisedCommandResponse)
    }

    
    
    // This displays the answer on the answer div
    document.getElementById("answer").innerHTML = answer

    // To reset the input field to "" once answer is given
    document.getElementById("commandInput").value = ""


}) // askBtn => on click function

// --------------------------------------- BEWARE, FUNCTIONS AHEAD ---------------------------------------

// Function to get random values from arrays 
function random(array) {
let getRandom = Math.floor(Math.random() * array.length)
return array[getRandom]
}

function openSite(siteName) {
    window.open(siteName,"",'width=1000,height=600,toolbar=no,location=yes,directories=yes,status=yes,menubar=yes,scrollbars=yes,copyhistory=yes,resizable=yes')
}

// Function to get the date and time
function getDateTime() {
    let today = new Date()
    let dayNum = today.getUTCDay()
    let date = today.getDate()
    let day
    let monthNum = today.getMonth()+1
    let month

    function getTime() { 

        let hours = today.getHours()
        let minutes = today.getMinutes()
        let postTime
        let time

        // Get time in 12hrs
        if (hours > 12) {
            hours -= 12
            postTime = "pm"
        }else {
            postTime = "am"
        }

        // Get minutes in double digits at all times
        if (minutes < 10) {
            minutes = "0" + minutes
        }

        // Set the time to how it should be displayed in html
        time = hours + '</div>' + ":" + '<div id="dateTime">'+ minutes + " " + postTime + '</div>'
        
        return time
    }

    // Get the time (to be displayed) and store it in a variable called time
    // Initial getTime function call
    time = getTime()

    // Assign day names to dayNum
    if (dayNum === 1) {
        day = "Mon"
    }else if (dayNum === 2) {
        day = "Tue"
    }else if (dayNum === 3) {
        day = "Wed"
    }else if (dayNum === 4) {
        day = "Thr"
    }else if (dayNum === 5) {
        day = "Fri"
    }else if (dayNum === 6) {
        day = "Sat"
    }else {
        day = "Sun"
    }

    // Assign month names to monthNum
    if (monthNum === 1) {
        month = "Jan"
    }else if (monthNum === 2) {
        month = "Feb"
    }else if (monthNum === 3) {
        month = "Mar"
    }else if (monthNum === 4) {
        month = "Apr"
    }else if (monthNum === 5) {
        month = "May"
    }else if (monthNum === 6) {
        month = "Jun"
    }else if (monthNum === 7) {
        month = "Jul"
    }else if (monthNum === 8) {
        month = "Aug"
    }else if (monthNum === 9) {
        month = "Sep"
    }else if (monthNum === 10) {
        month = "Oct"
    }else if (monthNum === 11) {
        month = "Nov"
    }else if (monthNum === 12) {
        month = "Dec"
    }

    // It's 7:38 on Thr, 31 Dec
    let greeting = "It's " + '<div id="dateTime">' + time + " on " + '<div id="dateTime">'+ day + ", " + date + " " + month + '</div>'
    return greeting
}

// Function to display them on screen (recursively)
function showGreeting() {
    // Set the greeting to the greeting div
    document.getElementById("greeting").innerHTML = getDateTime()

    // Recursion to get current date without refreshing the page (Gets the time every two seconds)
    setTimeout(showGreeting, 2000)
}

// Initial function call for date and time
showGreeting()