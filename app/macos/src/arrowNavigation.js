// For arrow key navigation
document.addEventListener("keydown", (event) => {
  // Key is ArrowUp or ArrowDown?
  if (event.code === "ArrowDown" || event.code === "ArrowUp") {
    event.preventDefault();
    // get tabIndex of current element
    let tabIndex = event.target.tabIndex;
    // increment or decrement tabindex depending on Key (ArrowUp -> previous Element, ArrowDown -> next element)
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
  // Key is ArrowLeft or ArrowRight?
  else if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
    event.preventDefault();
    // get tabIndex of current element
    let tabIndex = event.target.tabIndex;
    // increment or decrement tabindex depending on Key (ArrowUp -> previous Element, ArrowDown -> next element)
    tabIndex += event.code === "ArrowLeft" ? -1 : 1;

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
