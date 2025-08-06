import { createAccentButtons, setLastFocusedInput } from "../utils/helpers.js";

export const renderQuizScreen = (
  container,
  props,
  onAnswer,
  onNext,
  onQuit
) => {
  const {
    currentProblems,
    currentProblemIndex,
    feedback,
    isAnswered,
    incorrectAnswers,
  } = props;
  const problem = currentProblems[currentProblemIndex];

  // --- 静的UIの更新 ---
  container.querySelector("#quiz-topic").textContent = problem.topic;
  container.querySelector("#quiz-progress").textContent = `問題 ${
    currentProblemIndex + 1
  } / ${currentProblems.length}`;
  container.querySelector("#quiz-question").innerHTML = problem.question;

  // --- 回答欄の生成 ---
  const answerOptionsContainer = container.querySelector("#answer-options");
  answerOptionsContainer.innerHTML = "";

  if (problem.type === "fill-in-the-blank") {
    const input = document.createElement("input");
    input.type = "text";
    input.className =
      "w-full p-3 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 outline-none transition";
    input.placeholder = "回答を入力...";
    input.autocomplete = "off";
    input.addEventListener("focus", () => setLastFocusedInput(input));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitBtn.click();
      }
    });
    answerOptionsContainer.appendChild(input);
    createAccentButtons(answerOptionsContainer);

    const submitBtn = document.createElement("button");
    submitBtn.id = "submit-answer-btn";
    submitBtn.textContent = "回答する";
    submitBtn.className =
      "mt-3 w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-colors";
    submitBtn.onclick = () => {
      if (!isAnswered) onAnswer(input.value);
    };
    answerOptionsContainer.appendChild(submitBtn);
    setTimeout(() => input.focus(), 100);
  } else if (problem.type === "form-quiz") {
    const form = document.createElement("div");
    const numItems = problem.sub_questions.length;
    const gridTemplate =
      numItems > 2
        ? `grid-cols-2 grid-flow-col grid-rows-${Math.ceil(numItems / 2)}`
        : `grid-cols-1`;
    form.className = `grid ${gridTemplate} gap-x-6 gap-y-4`;

    problem.sub_questions.forEach((sq, index) => {
      const group = document.createElement("div");
      const inputId = `form-quiz-input-${index}`;
      group.innerHTML = `
          <label for="${inputId}" class="block text-sm font-medium text-slate-700">${sq.label}</label>
          <input type="text" id="${inputId}" class="mt-1 block w-full border-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition" autocomplete="off">
      `;
      const input = group.querySelector("input");
      input.addEventListener("focus", () => setLastFocusedInput(input));
      form.appendChild(group);
    });
    answerOptionsContainer.appendChild(form);
    createAccentButtons(answerOptionsContainer);

    const submitBtn = document.createElement("button");
    submitBtn.id = "submit-answer-btn";
    submitBtn.textContent = "判定する";
    submitBtn.className =
      "mt-4 w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-colors";
    submitBtn.onclick = () => {
      if (!isAnswered) onAnswer(null);
    };
    answerOptionsContainer.appendChild(submitBtn);
  } else if (problem.type === "scramble") {
    answerOptionsContainer.innerHTML = `
      <div class="p-4 mb-4 text-center bg-slate-100 rounded-lg min-h-[60px] text-xl font-medium" id="scramble-answer-area"></div>
      <div class="flex flex-wrap justify-center gap-3 mb-4" id="scramble-words-container"></div>
      <div class="flex justify-center gap-3 mb-4" id="scramble-controls"></div>
    `;

    const answerArea = container.querySelector("#scramble-answer-area");
    const wordsContainer = container.querySelector("#scramble-words-container");
    const controlsContainer = container.querySelector("#scramble-controls");

    problem.words
      .sort(() => 0.5 - Math.random())
      .forEach((word) => {
        const button = document.createElement("button");
        button.textContent = word;
        button.className =
          "word-button px-4 py-2 bg-white border-2 border-slate-300 rounded-lg text-lg font-semibold hover:bg-indigo-50 hover:border-indigo-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed";
        button.addEventListener("click", () => {
          if (answerArea.textContent.length > 0) {
            answerArea.textContent += " ";
          }
          answerArea.textContent += word;
          button.disabled = true;
        });
        wordsContainer.appendChild(button);
      });

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "やり直す";
    clearBtn.className =
      "px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors";
    clearBtn.onclick = () => {
      answerArea.textContent = "";
      wordsContainer
        .querySelectorAll(".word-button")
        .forEach((btn) => (btn.disabled = false));
    };
    controlsContainer.appendChild(clearBtn);

    const backspaceBtn = document.createElement("button");
    backspaceBtn.textContent = "一単語消す";
    backspaceBtn.className =
      "px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors";
    backspaceBtn.onclick = () => {
      const currentWords = answerArea.textContent.trim().split(" ");
      if (currentWords.length > 0 && currentWords[0] !== "") {
        const lastWord = currentWords.pop();
        answerArea.textContent = currentWords.join(" ");

        const wordButtons = wordsContainer.querySelectorAll(
          ".word-button:disabled"
        );
        for (const btn of Array.from(wordButtons).reverse()) {
          if (btn.textContent === lastWord) {
            btn.disabled = false;
            break;
          }
        }
      }
    };
    controlsContainer.appendChild(backspaceBtn);

    const submitBtn = document.createElement("button");
    submitBtn.id = "submit-answer-btn";
    submitBtn.textContent = "回答する";
    submitBtn.className =
      "mt-3 w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-colors";
    submitBtn.onclick = () => {
      if (!isAnswered) {
        onAnswer(answerArea.textContent);
      }
    };
    answerOptionsContainer.appendChild(submitBtn);
  }

  // --- イベントリスナー設定 ---
  container.querySelector("#quit-quiz-btn").onclick = onQuit;
  const nextButton = container.querySelector("#next-question-btn");
  nextButton.onclick = onNext;

  // --- 回答後のフィードバック表示 ---
  if (isAnswered) {
    const feedbackContainer = container.querySelector("#feedback-container");
    feedbackContainer.innerHTML = "";
    const feedbackEl = document.createElement("div");
    feedbackEl.className = `p-4 rounded-lg font-bold text-center ${
      feedback.isCorrect
        ? "bg-green-100 text-green-700 feedback-correct"
        : "bg-red-100 text-red-700 feedback-incorrect"
    }`;
    feedbackEl.textContent = feedback.message;
    feedbackContainer.appendChild(feedbackEl);
    nextButton.classList.remove("hidden");
    nextButton.focus();

    const submitBtn = container.querySelector("#submit-answer-btn");
    if (submitBtn) submitBtn.style.display = "none";

    // ... (入力フィールドの無効化と正誤表示のロジックは同様)
    if (problem.type === "form-quiz") {
      const inputs = container.querySelectorAll("input");
      const lastIncorrect = incorrectAnswers[incorrectAnswers.length - 1];
      const wasIncorrect =
        !feedback.isCorrect && lastIncorrect?.problem === problem;
      const userAnswers = wasIncorrect
        ? lastIncorrect.userAnswers
        : problem.sub_questions.map((sq) => sq.answer);

      problem.sub_questions.forEach((sq, index) => {
        const input = inputs[index];
        input.disabled = true;
        input.value = userAnswers[index];
        if (
          userAnswers[index].trim().toLowerCase() ===
          sq.answer.trim().toLowerCase()
        ) {
          input.classList.add("border-green-500", "bg-green-50");
        } else {
          input.classList.add("border-red-500", "bg-red-50");
          const hint = document.createElement("span");
          hint.className = "text-xs text-red-600 ml-1 mt-1 block";
          hint.textContent = `正解: ${sq.answer}`;
          input.parentElement.appendChild(hint);
        }
      });
    }
  }

  // 最初のレンダリング時にフォーカスを設定
  setTimeout(() => {
    const firstInput = container.querySelector('input[type="text"]');
    if (firstInput && !isAnswered) {
      firstInput.focus();
      setLastFocusedInput(firstInput);
    }
  }, 100);
};
