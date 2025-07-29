document.addEventListener("DOMContentLoaded", () => {
  // --- DOM要素 ---
  const startScreen = document.getElementById("start-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const resultScreen = document.getElementById("result-screen");
  const loadingMessage = document.getElementById("loading-message");
  const lessonSelection = document.getElementById("lesson-selection");
  const quizTopic = document.getElementById("quiz-topic");
  const progressIndicator = document.getElementById("progress-indicator");
  const questionText = document.getElementById("question-text");
  const answerOptions = document.getElementById("answer-options");
  const feedbackContainer = document.getElementById("feedback-container");
  const nextQuestionBtn = document.getElementById("next-question-btn");
  const quitQuizBtn = document.getElementById("quit-quiz-btn");
  let lastFocusedInput = null;

  // --- 状態管理 ---
  let allProblems = [];
  let currentQuizProblems = [];
  let currentProblemIndex = 0;
  let score = 0;
  let currentLesson = 0;

  // --- 初期化 ---
  async function init() {
    try {
      // 外部JSONファイルを読み込む
      const response = await fetch("problems.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      allProblems = await response.json();

      // 読み込み成功後の処理
      loadingMessage.textContent =
        "学習したい文法カテゴリーを選んで、クイズを始めましょう。";
      const lessons = [...new Set(allProblems.map((p) => p.lesson))];
      renderLessons(lessons);
      lessonSelection.classList.remove("hidden");
    } catch (error) {
      loadingMessage.textContent =
        "問題データの読み込みに失敗しました。problems.json を確認してください。";
      loadingMessage.classList.add("text-red-500");
      console.error("Failed to load problems.json:", error);
    }

    lessonSelection.addEventListener("click", startQuiz);
    nextQuestionBtn.addEventListener("click", nextQuestion);
    quitQuizBtn.addEventListener("click", showStartScreen);

    document.getElementById("retry-quiz-btn").addEventListener("click", () => {
      const problemsForLesson = allProblems.filter(
        (p) => p.lesson === currentLesson
      );
      setupQuiz(problemsForLesson, currentLesson);
    });
    document
      .getElementById("back-to-home-btn")
      .addEventListener("click", showStartScreen);
  }

  // --- レッスン表示 ---
  function renderLessons(lessons) {
    lessonSelection.innerHTML = "";
    lessons
      .sort((a, b) => a - b)
      .forEach((lesson) => {
        const button = document.createElement("button");
        button.className =
          "p-4 bg-white border-2 border-slate-200 rounded-lg text-lg font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-500 transition-all duration-200";
        button.textContent = lesson;
        button.dataset.lesson = lesson;
        lessonSelection.appendChild(button);
      });
  }

  // --- クイズ開始 ---
  function startQuiz(e) {
    if (e.target.matches("button[data-lesson]")) {
      currentLesson = Number(e.target.dataset.lesson);
      const problemsForLesson = allProblems.filter(
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

    startScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");

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
      input.autocomplete = "off"; // ★変更: 履歴の非表示設定を追加
      input.addEventListener("focus", () => {
        lastFocusedInput = input;
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
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

      // 1. 要素の数を取得
      const numItems = problem.sub_questions.length;

      // 2. 2列レイアウトに必要な行数を計算 (例: 6個なら3行、7個や8個なら4行)
      const numRows = Math.ceil(numItems / 2);

      // 3. 計算した行数を使ってクラス名を動的に生成
      form.className = `grid grid-cols-2 sm:grid-flow-col sm:grid-rows-${numRows} gap-x-6 gap-y-4`;

      problem.sub_questions.forEach((sq, index) => {
        const group = document.createElement("div");
        const inputId = `form-quiz-input-${index}`;
        // ★変更: 履歴の非表示設定(autocomplete="off")を追加
        group.innerHTML = `
                  <label for="${inputId}" class="block text-sm font-medium text-slate-700">${sq.label}</label>
                  <input type="text" id="${inputId}" class="mt-1 block w-full border-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition" autocomplete="off">
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
    // ボタンは入力欄の直下にくるように調整
    buttonContainer.className = "mt-3 flex flex-wrap justify-center gap-2";

    accentChars.forEach((char) => {
      const button = document.createElement("button");
      button.type = "button"; // フォームの送信を防止
      button.className =
        "w-10 h-10 bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 transition-colors text-lg font-mono";
      button.textContent = char;
      button.addEventListener("click", (e) => {
        e.preventDefault(); // デフォルトのクリック動作をキャンセル
        if (lastFocusedInput) {
          const start = lastFocusedInput.selectionStart;
          const end = lastFocusedInput.selectionEnd;
          const text = lastFocusedInput.value;
          // カーソル位置に文字を挿入
          lastFocusedInput.value =
            text.substring(0, start) + char + text.substring(end);
          // フォーカスを戻し、カーソルを挿入した文字の後ろに移動
          lastFocusedInput.focus();
          const newPos = start + 1;
          lastFocusedInput.setSelectionRange(newPos, newPos);
        }
      });
      buttonContainer.appendChild(button);
    });

    // fill-in-the-blank の場合は入力欄の直後に挿入
    // if (container.querySelector('input[type="text"]')) {
    //   container.querySelector('input[type="text"]').after(buttonContainer);
    // } else {
    {
      container.appendChild(buttonContainer);
    }
  }

  // --- 回答チェック ---
  function checkAnswer(userAnswer) {
    const problem = currentQuizProblems[currentProblemIndex];
    let isCorrect = false;

    if (problem.type === "form-quiz") {
      let allCorrect = true;
      const inputs = answerOptions.querySelectorAll("input");
      problem.sub_questions.forEach((sq, index) => {
        const input = inputs[index];
        if (
          input.value.trim().toLowerCase() === sq.answer.trim().toLowerCase()
        ) {
          input.classList.remove("border-red-500");
          input.classList.add("border-green-500", "bg-green-50");
        } else {
          allCorrect = false;
          input.classList.remove("border-green-500");
          input.classList.add("border-red-500", "bg-red-50");

          // 既にヒントが表示されている場合は追加しない
          if (!input.parentElement.querySelector(".hint-text")) {
            const hint = document.createElement("span");
            hint.className = "text-xs text-red-600 ml-1 mt-1 block hint-text";
            hint.textContent = `正解: ${sq.answer}`;
            input.parentElement.appendChild(hint);
          }
        }
      });
      isCorrect = allCorrect;
    } else {
      isCorrect =
        userAnswer.trim().toLowerCase() === problem.answer.trim().toLowerCase();
    }

    if (isCorrect) {
      score++;
      showFeedback(true, "正解！");
    } else {
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
      if (!el.parentElement.classList.contains("flex-wrap")) {
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

  // --- 結果表示 ---
  function showResult() {
    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    const percentage = Math.round((score / currentQuizProblems.length) * 100);
    document.getElementById(
      "result-lesson"
    ).textContent = `レッスン: ${currentLesson}`;
    document.getElementById(
      "score-text"
    ).textContent = `${score} / ${currentQuizProblems.length}`;
    document.getElementById(
      "percentage-text"
    ).textContent = `正答率: ${percentage}%`;
  }

  function showStartScreen() {
    resultScreen.classList.add("hidden");
    quizScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
  }

  // --- アプリケーション開始 ---
  init();
});
