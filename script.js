document.addEventListener("DOMContentLoaded", () => {
  // --- DOM要素 ---
  const startScreen = document.getElementById("start-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const resultScreen = document.getElementById("result-screen");
  const loadingMessage = document.getElementById("loading-message");
  const lessonSelection = document.getElementById("lesson-selection");
  const quizTypeSelection = document.getElementById("quiz-type-selection");
  const quizTopic = document.getElementById("quiz-topic");
  const progressIndicator = document.getElementById("progress-indicator");
  const questionText = document.getElementById("question-text");
  const answerOptions = document.getElementById("answer-options");
  const feedbackContainer = document.getElementById("feedback-container");
  const nextQuestionBtn = document.getElementById("next-question-btn");
  const quitQuizBtn = document.getElementById("quit-quiz-btn");
  let lastFocusedInput = null;

  // --- 状態管理 ---
  let quizData = {
    grammar: [],
    vocabulary: [],
    text: [],
  };
  let currentQuizProblems = [];
  let currentProblemIndex = 0;
  let score = 0;
  let currentLesson = 0;
  let currentQuizType = "grammar"; // デフォルトの問題種別
  let incorrectAnswers = []; // 間違えた問題を保存する配列

  // --- 初期化 ---
  async function init() {
    try {
      // 3つのJSONファイルを並行して読み込む
      const [grammarRes, vocabularyRes, textRes] = await Promise.all([
        fetch("problems.json"),
        fetch("vocabulary.json"), // 単語問題ファイル
        fetch("text.json"), // 本文問題ファイル
      ]);

      if (!grammarRes.ok || !vocabularyRes.ok || !textRes.ok) {
        throw new Error(`HTTP error! Failed to load one or more JSON files.`);
      }

      quizData.grammar = await grammarRes.json();
      quizData.vocabulary = await vocabularyRes.json();
      quizData.text = await textRes.json();

      // 読み込み成功後の処理
      loadingMessage.innerHTML =
        "学習したいレッスンを選んで<br />クイズを始めましょう。";
      quizTypeSelection.classList.remove("hidden"); // 切り替えボタン表示
      renderLessonButtons(currentQuizType); // 初期表示
      lessonSelection.classList.remove("hidden");
    } catch (error) {
      loadingMessage.textContent =
        "問題データの読み込みに失敗しました。ファイルを確認してください。";
      loadingMessage.classList.add("text-red-500");
      console.error("Failed to load quiz data:", error);
    }

    lessonSelection.addEventListener("click", startQuiz);
    quizTypeSelection.addEventListener("click", handleQuizTypeChange);
    nextQuestionBtn.addEventListener("click", nextQuestion);
    quitQuizBtn.addEventListener("click", showStartScreen);

    document.getElementById("retry-quiz-btn").addEventListener("click", () => {
      const problemsForLesson = quizData[currentQuizType].filter(
        (p) => p.lesson === currentLesson
      );
      setupQuiz(problemsForLesson, currentLesson);
    });
    document
      .getElementById("back-to-home-btn")
      .addEventListener("click", showStartScreen);
  }

  // --- 画面切り替え ---
  function showScreen(screenToShow) {
    [startScreen, quizScreen, resultScreen].forEach((screen) => {
      screen.classList.add("hidden");
    });
    screenToShow.classList.remove("hidden");
  }

  // --- 問題種別切り替え ---
  function handleQuizTypeChange(e) {
    if (e.target.matches("button[data-type]")) {
      currentQuizType = e.target.dataset.type;

      // ボタンの選択状態を更新
      quizTypeSelection.querySelectorAll("button").forEach((btn) => {
        btn.classList.remove("bg-indigo-600", "text-white");
        btn.classList.add("bg-white", "text-slate-700");
      });
      e.target.classList.add("bg-indigo-600", "text-white");
      e.target.classList.remove("bg-white", "text-slate-700");

      renderLessonButtons(currentQuizType);
    }
  }

  // --- レッスン表示 ---
  function renderLessonButtons(quizType) {
    lessonSelection.innerHTML = "";
    const problems = quizData[quizType];
    const progressData = JSON.parse(localStorage.getItem("quizProgress")) || {};

    if (!problems || problems.length === 0) {
      lessonSelection.innerHTML = `<p class="text-slate-500 col-span-full">このカテゴリーには問題がありません。</p>`;
      return;
    }
    const lessons = [...new Set(problems.map((p) => p.lesson))];
    lessons
      .sort((a, b) => a - b)
      .forEach((lesson) => {
        const button = document.createElement("button");
        button.className =
          "p-4 bg-white border-2 border-slate-200 rounded-lg text-lg font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-500 transition-all duration-200 flex flex-col items-center justify-center";
        button.dataset.lesson = lesson;

        const lessonProgress =
          progressData[quizType] && progressData[quizType][lesson]
            ? progressData[quizType][lesson]
            : { score: 0, total: 0, percentage: 0 };

        button.innerHTML = `
            <span>Lesson ${lesson}</span>
            <div class="mt-2 w-full bg-slate-200 rounded-full h-2.5">
                <div class="bg-indigo-500 h-2.5 rounded-full" style="width: ${lessonProgress.percentage}%"></div>
            </div>
            <span class="text-xs text-slate-500 mt-1">${lessonProgress.percentage}%</span>
        `;
        lessonSelection.appendChild(button);
      });
  }

  // --- クイズ開始 ---
  function startQuiz(e) {
    const button = e.target.closest("button[data-lesson]");
    if (button) {
      currentLesson = Number(button.dataset.lesson);
      // 現在選択されている問題種別のデータから問題を取得
      const problemsForLesson = quizData[currentQuizType].filter(
        (p) => p.lesson === currentLesson
      );
      setupQuiz(problemsForLesson, currentLesson);
    }
  }

  function setupQuiz(problems, lessonName) {
    currentQuizProblems = [...problems].sort(() => 0.5 - Math.random()); // シャッフル
    currentProblemIndex = 0;
    score = 0;
    currentLesson = lessonName;
    lastFocusedInput = null;
    incorrectAnswers = []; // クイズ開始時に間違えた問題リストをリセット

    showScreen(quizScreen);
    displayProblem();
  }

  // --- 問題表示 ---
  function displayProblem() {
    feedbackContainer.innerHTML = "";
    nextQuestionBtn.classList.add("hidden");

    const problem = currentQuizProblems[currentProblemIndex];
    quizTopic.textContent = problem.topic;
    progressIndicator.textContent = `問題 ${currentProblemIndex + 1} / ${
      currentQuizProblems.length
    }`;
    questionText.textContent = problem.question;

    answerOptions.innerHTML = "";
    if (problem.type === "multiple-choice") {
      problem.options.forEach((option) => {
        const button = document.createElement("button");
        button.className =
          "w-full text-left p-4 bg-white border-2 border-slate-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500";
        button.textContent = option;
        button.addEventListener("click", () => checkAnswer(option));
        answerOptions.appendChild(button);
      });
    } else if (problem.type === "fill-in-the-blank") {
      const input = document.createElement("input");
      input.type = "text";
      input.className =
        "w-full p-3 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 outline-none transition";
      input.placeholder = "回答を入力...";
      input.autocomplete = "off";
      input.addEventListener("focus", () => {
        lastFocusedInput = input;
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Enterキーのデフォルト動作をキャンセル
          checkAnswer(input.value);
        }
      });
      answerOptions.appendChild(input);
      createAccentButtons(answerOptions);

      const submitBtn = document.createElement("button");
      submitBtn.textContent = "回答する";
      submitBtn.className =
        "mt-3 w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-colors";
      submitBtn.onclick = () => checkAnswer(input.value);
      answerOptions.appendChild(submitBtn);
      setTimeout(() => input.focus(), 100);
    } else if (problem.type === "form-quiz") {
      const form = document.createElement("div");

      const numItems = problem.sub_questions.length;
      const numRows = Math.ceil(numItems / 2);
      form.className = `grid grid-cols-2 grid-flow-col grid-rows-${numRows} gap-x-6 gap-y-4`;

      problem.sub_questions.forEach((sq, index) => {
        const group = document.createElement("div");
        const inputId = `form-quiz-input-${index}`;
        group.innerHTML = `
                  <label for="${inputId}" class="block text-sm font-medium text-slate-700">${sq.label}</label>
                  <input type="text" id="${inputId}" class="mt-1 block w-full border-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition" autocomplete="off">
                  `;
        const input = group.querySelector("input");
        input.addEventListener("focus", () => {
          lastFocusedInput = input;
        });
        form.appendChild(group);
      });
      answerOptions.appendChild(form);
      createAccentButtons(answerOptions);

      const submitBtn = document.createElement("button");
      submitBtn.textContent = "判定する";
      submitBtn.className =
        "mt-4 w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-colors";
      submitBtn.onclick = () => checkAnswer(null);
      answerOptions.appendChild(submitBtn);
    } else if (problem.type === "scramble") {
      answerOptions.innerHTML = `
        <div class="p-4 mb-4 text-center bg-slate-100 rounded-lg min-h-[60px] text-xl font-medium" id="scramble-answer-area"></div>
        <div class="flex flex-wrap justify-center gap-3 mb-4" id="scramble-words-container"></div>
        <div class="flex justify-center gap-3 mb-4" id="scramble-controls"></div>
      `;

      const answerArea = document.getElementById("scramble-answer-area");
      const wordsContainer = document.getElementById(
        "scramble-words-container"
      );
      const controlsContainer = document.getElementById("scramble-controls");

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
      submitBtn.textContent = "回答する";
      submitBtn.className =
        "mt-3 w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-colors";
      submitBtn.onclick = () => checkAnswer(answerArea.textContent);
      answerOptions.appendChild(submitBtn);
    }
  }

  function createAccentButtons(container) {
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
          const newPos = start + 1;
          lastFocusedInput.setSelectionRange(newPos, newPos);
        }
      });
      buttonContainer.appendChild(button);
    });

    container.appendChild(buttonContainer);
  }

  // --- 回答チェック ---
  function checkAnswer(userAnswer) {
    const problem = currentQuizProblems[currentProblemIndex];
    let isCorrect = false;
    let userAnswersForForm = []; // form-quizのユーザー回答を保存

    if (problem.type === "form-quiz") {
      let allCorrect = true;
      const inputs = answerOptions.querySelectorAll("input");
      problem.sub_questions.forEach((sq, index) => {
        const input = inputs[index];
        userAnswersForForm.push(input.value); // ユーザーの回答を記録
        if (
          input.value.trim().toLowerCase() === sq.answer.trim().toLowerCase()
        ) {
          input.classList.remove("border-red-500");
          input.classList.add("border-green-500", "bg-green-50");
        } else {
          allCorrect = false;
          input.classList.remove("border-green-500");
          input.classList.add("border-red-500", "bg-red-50");

          if (!input.parentElement.querySelector(".hint-text")) {
            const hint = document.createElement("span");
            hint.className = "text-xs text-red-600 ml-1 mt-1 block hint-text";
            hint.textContent = `正解: ${sq.answer}`;
            input.parentElement.appendChild(hint);
          }
        }
      });
      isCorrect = allCorrect;
    } else if (problem.type === "scramble") {
      isCorrect = userAnswer.trim() === problem.answer.trim();
    } else {
      isCorrect =
        userAnswer.trim().toLowerCase() === problem.answer.trim().toLowerCase();
    }

    if (isCorrect) {
      score++;
      showFeedback(true, "正解！");
    } else {
      const incorrectData = { problem: problem };
      if (problem.type === "form-quiz") {
        incorrectData.userAnswers = userAnswersForForm;
      } else {
        incorrectData.userAnswer = userAnswer;
      }
      incorrectAnswers.push(incorrectData);

      const message =
        problem.type === "form-quiz"
          ? "不正解... 赤い箇所を確認してください。"
          : `不正解... 正解は「${problem.answer}」です。`;
      showFeedback(false, message);
    }

    disableInputs();
    nextQuestionBtn.classList.remove("hidden");
    nextQuestionBtn.focus();
  }

  // --- UI更新 ---
  function showFeedback(isCorrect, message) {
    feedbackContainer.innerHTML = "";
    const feedbackEl = document.createElement("div");
    feedbackEl.className = `p-4 rounded-lg font-bold text-center`;
    feedbackEl.textContent = message;
    if (isCorrect) {
      feedbackEl.classList.add(
        "bg-green-100",
        "text-green-700",
        "feedback-correct"
      );
    } else {
      feedbackEl.classList.add(
        "bg-red-100",
        "text-red-700",
        "feedback-incorrect"
      );
    }
    feedbackContainer.appendChild(feedbackEl);
  }

  function disableInputs() {
    answerOptions.querySelectorAll("button, input").forEach((el) => {
      el.disabled = true;
      if (
        !el.parentElement.classList.contains("flex-wrap") &&
        !el.parentElement.id.includes("scramble-controls")
      ) {
        el.classList.add("opacity-70", "cursor-not-allowed");
      } else {
        el.classList.add("opacity-70");
      }
    });
  }

  function nextQuestion() {
    currentProblemIndex++;
    if (currentProblemIndex < currentQuizProblems.length) {
      displayProblem();
    } else {
      showResult();
    }
  }

  // --- 結果保存・表示 ---
  function saveProgress() {
    const progressData = JSON.parse(localStorage.getItem("quizProgress")) || {};
    if (!progressData[currentQuizType]) {
      progressData[currentQuizType] = {};
    }

    const lessonKey =
      typeof currentLesson === "string" && currentLesson.includes("(復習)")
        ? currentLesson.split(" ")[0]
        : currentLesson;

    progressData[currentQuizType][lessonKey] = {
      score: score,
      total: currentQuizProblems.length,
      percentage: Math.round((score / currentQuizProblems.length) * 100),
    };
    localStorage.setItem("quizProgress", JSON.stringify(progressData));
  }

  function showResult() {
    saveProgress(); // 結果を保存
    showScreen(resultScreen);

    const percentage = Math.round((score / currentQuizProblems.length) * 100);
    document.getElementById(
      "result-lesson"
    ).textContent = `レッスン: ${currentLesson} (${currentQuizType})`;
    document.getElementById(
      "score-text"
    ).textContent = `${score} / ${currentQuizProblems.length}`;
    document.getElementById(
      "percentage-text"
    ).textContent = `正答率: ${percentage}%`;

    const retryQuizBtn = document.getElementById("retry-quiz-btn");
    const newRetryBtn = retryQuizBtn.cloneNode(true);
    retryQuizBtn.parentNode.replaceChild(newRetryBtn, retryQuizBtn);
    newRetryBtn.addEventListener("click", () => {
      const lessonNumber =
        typeof currentLesson === "string"
          ? parseInt(currentLesson.split(" ")[0])
          : currentLesson;
      const problemsForLesson = quizData[currentQuizType].filter(
        (p) => p.lesson === lessonNumber
      );
      setupQuiz(problemsForLesson, currentLesson);
    });

    const retryIncorrectBtn = document.getElementById("retry-incorrect-btn");
    if (incorrectAnswers.length > 0) {
      retryIncorrectBtn.classList.remove("hidden");

      const newBtn = retryIncorrectBtn.cloneNode(true);
      retryIncorrectBtn.parentNode.replaceChild(newBtn, retryIncorrectBtn);

      newBtn.addEventListener("click", () => {
        const incorrectProblems = incorrectAnswers.map((item) => item.problem);
        const reviewLessonName =
          typeof currentLesson === "string" && currentLesson.includes("(復習)")
            ? currentLesson
            : `${currentLesson} (復習)`;
        setupQuiz(incorrectProblems, reviewLessonName);
      });
    } else {
      retryIncorrectBtn.classList.add("hidden");
    }

    const feedbackContainer = document.getElementById(
      "incorrect-feedback-container"
    );
    feedbackContainer.innerHTML = "";

    if (incorrectAnswers.length > 0) {
      const title = document.createElement("h3");
      title.className = "text-xl font-bold text-slate-700 mb-4 text-center";
      title.textContent = "復習しましょう！✍️";
      feedbackContainer.appendChild(title);

      const list = document.createElement("div");
      list.className = "space-y-6";

      incorrectAnswers.forEach(({ problem, userAnswer, userAnswers }) => {
        const item = document.createElement("div");
        item.className = "bg-slate-50 p-4 rounded-lg";

        let feedbackHTML = `
          <p class="font-semibold text-slate-800">${problem.question}</p>
        `;

        if (problem.type === "form-quiz") {
          feedbackHTML += '<ul class="mt-2 space-y-1 list-disc list-inside">';
          problem.sub_questions.forEach((sq, index) => {
            const userAnswerText = userAnswers[index] || "(無回答)";
            if (userAnswerText.toLowerCase() !== sq.answer.toLowerCase()) {
              feedbackHTML += `
                        <li>
                            <span class="font-medium">${sq.label}:</span>
                            <span class="text-red-600 line-through">${userAnswerText}</span>
                            <span class="text-green-600 font-bold ml-2">→ ${sq.answer}</span>
                        </li>`;
            }
          });
          feedbackHTML += "</ul>";
        } else {
          feedbackHTML += `
              <p class="mt-2">
                <span class="font-medium">あなたの回答:</span>
                <span class="text-red-600">${userAnswer || "(無回答)"}</span>
              </p>
              <p>
                <span class="font-medium">正解:</span>
                <span class="text-green-600 font-bold">${problem.answer}</span>
              </p>
            `;
        }
        item.innerHTML = feedbackHTML;
        list.appendChild(item);
      });
      feedbackContainer.appendChild(list);
    }
  }

  function showStartScreen() {
    renderLessonButtons(currentQuizType); // 解答状況を更新して表示
    showScreen(startScreen);
  }

  // --- アプリケーション開始 ---
  init();
});
