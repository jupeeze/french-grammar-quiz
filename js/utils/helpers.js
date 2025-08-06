let lastFocusedInput = null;

export function setLastFocusedInput(element) {
  lastFocusedInput = element;
}

export function createAccentButtons(container) {
  const accentChars = [
    "à",
    "â",
    "é",
    "è",
    "ê",
    "ë",
    "î",
    "ï",
    "ô",
    "û",
    "ù",
    "ç",
  ];
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "mt-3 flex flex-wrap justify-center gap-2";
  accentChars.forEach((char) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "w-10 h-10 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition-colors text-lg font-mono";
    button.textContent = char;
    button.addEventListener("click", (e) => {
      e.preventDefault();
      if (lastFocusedInput) {
        const start = lastFocusedInput.selectionStart;
        const end = lastFocusedInput.selectionEnd;
        const text = lastFocusedInput.value;
        lastFocusedInput.value =
          text.substring(0, start) + char + text.substring(end);
        lastFocusedInput.focus();
        lastFocusedInput.setSelectionRange(start + 1, start + 1);
      }
    });
    buttonContainer.appendChild(button);
  });
  container.appendChild(buttonContainer);
}
