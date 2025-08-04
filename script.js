document.addEventListener("DOMContentLoaded", () => {
  // --- DOM要素 ---
  const appContainer = document.getElementById("app-container");
  let lastFocusedInput = null;

  // --- 状態管理 ---
  const state = {
    quizData: { grammar: [], vocabulary: [], text: [] },
    currentQuizType: "grammar",
    currentLesson: null,
    currentProblems: [],
    currentProblemIndex: 0,
    score: 0,
    incorrectAnswers: [],
    activeScreen: "loading", // 'loading', 'start', 'quiz', 'result'
    progress: {},
    feedback: null, // { isCorrect: boolean, message: string }
    isAnswered: false, // 回答済みかどうかのフラグ
  };

  // --- 状態更新関数 ---
  const setState = (newState) => {
    Object.assign(state, newState);
    render();
  };

  // --- ヘルパー関数 ---
  const createAccentButtons = (container) => {
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
  };

  // --- コンポーネント ---

  const QuizTypeSelection = (props) => {
    const { currentQuizType } = props;
    const container = document.createElement("div");
    container.className =
      "w-fit mx-auto my-8 bg-white p-2 rounded-xl shadow-md flex gap-2 justify-center";

    const types = ["grammar", "vocabulary", "text"];
    const typeLabels = { grammar: "文法", vocabulary: "単語", text: "本文" };

    types.forEach((type) => {
      const button = document.createElement("button");
      button.dataset.type = type;
      button.textContent = typeLabels[type];
      button.className = `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        currentQuizType === type
          ? "bg-indigo-600 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`;
      button.onclick = () => {
        setState({ currentQuizType: type });
      };
      container.appendChild(button);
    });

    return container;
  };

  /**
   * スタート画面 コンポーネント
   */
  const StartScreen = (props) => {
    const { quizData, currentQuizType, progress } = props;
    const container = document.createElement("div");
    container.id = "start-screen";
    container.className =
      "bg-white p-8 rounded-2xl shadow-lg text-center relative";

    const problems = quizData[currentQuizType];
    const lessons = problems
      ? [...new Set(problems.map((p) => p.lesson))].sort((a, b) => a - b)
      : [];

    let lessonButtonsHTML = "";
    if (lessons.length > 0) {
      lessonButtonsHTML = lessons
        .map((lesson) => {
          const lessonProgress = progress[currentQuizType]?.[lesson] || {
            percentage: 0,
          };
          return `
            <button data-lesson="${lesson}" class="p-4 bg-white border-2 border-slate-200 rounded-lg text-lg font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-500 transition-all duration-200 flex flex-col items-center justify-center">
                <span>Lesson ${lesson}</span>
                <div class="mt-2 w-full bg-slate-200 rounded-full h-2.5">
                    <div class="bg-indigo-500 h-2.5 rounded-full" style="width: ${lessonProgress.percentage}%"></div>
                </div>
                <span class="text-xs text-slate-500 mt-1">${lessonProgress.percentage}%</span>
            </button>
          `;
        })
        .join("");
    } else {
      lessonButtonsHTML = `<p class="text-slate-500 col-span-full">このカテゴリーには問題がありません。</p>`;
    }

    container.innerHTML = `
        <h1 class="text-3xl font-bold text-indigo-600">フランス語 実践</h1>
        <p class="mt-4 text-slate-600">学習したいレッスンを選んで<br />クイズを始めましょう。</p>
        <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${lessonButtonsHTML}
        </div>
    `;

    container.querySelector(".grid").addEventListener("click", (e) => {
      const button = e.target.closest("button[data-lesson]");
      if (button) {
        const lesson = Number(button.dataset.lesson);
        const problemsForLesson = quizData[currentQuizType]
          .filter((p) => p.lesson === lesson)
          .sort(() => 0.5 - Math.random()); // Shuffle

        setState({
          activeScreen: "quiz",
          currentLesson: lesson,
          currentProblems: problemsForLesson,
          currentProblemIndex: 0,
          score: 0,
          incorrectAnswers: [],
        });
      }
    });

    return container;
  };

  /**
   * クイズ画面 コンポーネント
   */
  const QuizScreen = (props) => {
    const { currentProblems, currentProblemIndex, feedback, isAnswered } =
      props;
    const problem = currentProblems[currentProblemIndex];

    const container = document.createElement("div");
    container.id = "quiz-screen";
    container.className = "bg-white p-6 sm:p-8 rounded-2xl shadow-lg";

    // --- 回答チェック処理 ---
    const checkAnswer = (userAnswer) => {
      if (isAnswered) return;

      let isCorrect = false;
      let userAnswersForForm = [];

      if (problem.type === "form-quiz") {
        let allCorrect = true;
        const inputs = container.querySelectorAll("input");
        problem.sub_questions.forEach((sq, index) => {
          const input = inputs[index];
          userAnswersForForm.push(input.value);
          if (
            input.value.trim().toLowerCase() !== sq.answer.trim().toLowerCase()
          ) {
            allCorrect = false;
          }
        });
        isCorrect = allCorrect;
      } else if (problem.type === "scramble") {
        isCorrect = userAnswer.trim() === problem.answer.trim();
      } else {
        isCorrect =
          userAnswer.trim().toLowerCase() ===
          problem.answer.trim().toLowerCase();
      }

      const newScore = isCorrect ? state.score + 1 : state.score;
      let newIncorrectAnswers = [...state.incorrectAnswers];
      let feedbackMessage = `不正解... 正解は「${problem.answer}」です。`;

      if (isCorrect) {
        feedbackMessage = "正解！";
      } else {
        const incorrectData = { problem };
        if (problem.type === "form-quiz") {
          incorrectData.userAnswers = userAnswersForForm;
        } else {
          incorrectData.userAnswer = userAnswer;
        }
        newIncorrectAnswers.push(incorrectData);
        if (problem.type === "form-quiz") {
          feedbackMessage = "不正解... 赤い箇所を確認してください。";
        }
      }

      setState({
        score: newScore,
        incorrectAnswers: newIncorrectAnswers,
        isAnswered: true,
        feedback: { isCorrect, message: feedbackMessage },
      });
    };

    // --- UI構築 ---
    container.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div>
          <p class="text-sm font-semibold text-indigo-600">${problem.topic}</p>
          <p class="text-lg font-bold text-slate-700">問題 ${
            currentProblemIndex + 1
          } / ${currentProblems.length}</p>
        </div>
        <button id="quit-quiz-btn" class="text-sm text-slate-500 hover:text-red-600 transition-colors">終了する</button>
      </div>
      <div class="mb-6">
        <p class="text-xl leading-relaxed">${problem.question}</p>
      </div>
      <div id="answer-options" class="space-y-3"></div>
      <div id="feedback-container" class="mt-6 min-h-[80px]"></div>
      <button id="next-question-btn" class="hidden mt-4 w-full py-3 px-6 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600">次へ</button>
      `;

    const answerOptionsContainer = container.querySelector("#answer-options");

    // --- 問題タイプ別の回答欄を生成 ---
    if (problem.type === "fill-in-the-blank") {
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
      answerOptionsContainer.appendChild(input);
      createAccentButtons(answerOptionsContainer);

      const submitBtn = document.createElement("button");
      submitBtn.textContent = "回答する";
      submitBtn.className =
        "mt-3 w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-colors";
      submitBtn.onclick = () => checkAnswer(input.value);
      answerOptionsContainer.appendChild(submitBtn);
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
      answerOptionsContainer.appendChild(form);
      createAccentButtons(answerOptionsContainer);

      const submitBtn = document.createElement("button");
      submitBtn.textContent = "判定する";
      submitBtn.className =
        "mt-4 w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-colors";
      submitBtn.onclick = () => checkAnswer(null);
      answerOptionsContainer.appendChild(submitBtn);
    } else if (problem.type === "scramble") {
      answerOptionsContainer.innerHTML = `
        <div class="p-4 mb-4 text-center bg-slate-100 rounded-lg min-h-[60px] text-xl font-medium" id="scramble-answer-area"></div>
        <div class="flex flex-wrap justify-center gap-3 mb-4" id="scramble-words-container"></div>
        <div class="flex justify-center gap-3 mb-4" id="scramble-controls"></div>
      `;

      const answerArea = container.querySelector("#scramble-answer-area");
      const wordsContainer = container.querySelector(
        "#scramble-words-container"
      );
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
      submitBtn.textContent = "回答する";
      submitBtn.className =
        "mt-3 w-full py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 transition-colors";
      submitBtn.onclick = () => checkAnswer(answerArea.textContent);
      answerOptionsContainer.appendChild(submitBtn);
    }
    // --- イベントリスナー設定 ---
    container.querySelector("#quit-quiz-btn").onclick = () => {
      loadProgress();
      setState({ activeScreen: "start" });
    };

    const nextButton = container.querySelector("#next-question-btn");
    nextButton.onclick = () => {
      if (currentProblemIndex + 1 < currentProblems.length) {
        setState({
          currentProblemIndex: state.currentProblemIndex + 1,
          isAnswered: false,
          feedback: null,
        });
      } else {
        saveProgress();
        setState({ activeScreen: "result" });
      }
    };

    // --- 回答後のフィードバック表示 ---
    if (isAnswered) {
      const feedbackContainer = container.querySelector("#feedback-container");
      const feedbackEl = document.createElement("div");
      feedbackEl.className = `p-4 rounded-lg font-bold text-center ${
        feedback.isCorrect
          ? "bg-green-100 text-green-700 feedback-correct"
          : "bg-red-100 text-red-700 feedback-incorrect"
      }`;
      feedbackEl.textContent = feedback.message;
      feedbackContainer.appendChild(feedbackEl);
      nextButton.classList.remove("hidden");

      // 入力フィールドを無効化し、正誤を表示
      if (problem.type === "form-quiz") {
        const inputs = container.querySelectorAll("input");
        const userAnswers =
          state.incorrectAnswers.find((ia) => ia.problem === problem)
            ?.userAnswers || problem.sub_questions.map((sq) => sq.answer);
        problem.sub_questions.forEach((sq, index) => {
          const input = inputs[index];
          input.disabled = true;
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
      container
        .querySelectorAll("#answer-options button, #answer-options input")
        .forEach((el) => (el.disabled = true));
    }

    // 最初のレンダリング時にフォーカスを設定
    setTimeout(() => {
      const firstInput = container.querySelector('input[type="text"]');
      if (firstInput) firstInput.focus();
    }, 100);

    return container;
  };

  /**
   * 結果画面 コンポーネント
   */
  const ResultScreen = (props) => {
    const {
      score,
      currentProblems,
      currentLesson,
      currentQuizType,
      incorrectAnswers,
    } = props;
    const container = document.createElement("div");
    container.id = "result-screen";
    container.className = "bg-white p-8 rounded-2xl shadow-lg text-center";

    const percentage = Math.round((score / currentProblems.length) * 100);

    // ... 不正解問題の表示ロジック ...
    let incorrectFeedbackHTML = "...";

    container.innerHTML = `
        <h2 class="text-2xl font-bold text-slate-800">クイズ終了！</h2>
        <p class="mt-2 text-slate-600">レッスン: ${currentLesson} (${currentQuizType})</p>
        <div class="my-8">
          <p class="text-lg">正解数</p>
          <p class="text-6xl font-bold text-indigo-600">${score} / ${
      currentProblems.length
    }</p>
          <p class="mt-2 text-lg text-slate-500">正答率: ${percentage}%</p>
        </div>
        <div class="mt-8 text-left">${incorrectFeedbackHTML}</div>
        <div class="flex flex-col justify-center gap-4 mt-8">
            <button id="retry-quiz-btn">もう一度挑戦</button>
            <button id="retry-incorrect-btn" class="${
              incorrectAnswers.length > 0 ? "" : "hidden"
            }">間違えた問題だけ復習</button>
            <button id="back-to-home-btn">レッスン選択に戻る</button>
        </div>
      `;

    // --- イベントリスナー ---
    container.querySelector("#retry-quiz-btn").onclick = () => {
      const problemsForLesson = state.quizData[state.currentQuizType]
        .filter((p) => p.lesson === state.currentLesson)
        .sort(() => 0.5 - Math.random());
      setState({
        activeScreen: "quiz",
        currentProblems: problemsForLesson,
        currentProblemIndex: 0,
        score: 0,
        incorrectAnswers: [],
        isAnswered: false,
        feedback: null,
      });
    };
    container.querySelector("#retry-incorrect-btn").onclick = () => {
      const incorrectProblems = state.incorrectAnswers.map(
        (item) => item.problem
      );
      const reviewLessonName = `${state.currentLesson} (復習)`;
      setState({
        activeScreen: "quiz",
        currentLesson: reviewLessonName,
        currentProblems: incorrectProblems,
        currentProblemIndex: 0,
        score: 0,
        incorrectAnswers: [],
        isAnswered: false,
        feedback: null,
      });
    };
    container.querySelector("#back-to-home-btn").onclick = () => {
      loadProgress();
      setState({ activeScreen: "start" });
    };
  };

  // --- メインレンダリング関数 ---
  const render = () => {
    // コンテナをクリア
    appContainer.innerHTML = "";

    // 現在の画面に応じて適切なコンポーネントをレンダリング
    switch (state.activeScreen) {
      case "loading":
        appContainer.innerHTML = `<p>問題データを読み込んでいます...</p>`;
        break;
      case "start":
        appContainer.appendChild(
          QuizTypeSelection({ currentQuizType: state.currentQuizType })
        );
        appContainer.appendChild(
          StartScreen({
            quizData: state.quizData,
            currentQuizType: state.currentQuizType,
            progress: state.progress,
          })
        );
        break;
      case "quiz":
        // QuizScreenコンポーネントをレンダリング（詳細は省略）
        appContainer.appendChild(QuizScreen(state));
        break;
      case "result":
        // ResultScreenコンポーネントをレンダリング（詳細は省略）
        appContainer.appendChild(ResultScreen(state));
        break;
    }
  };

  // --- データ処理 ---
  const loadProgress = () => {
    const savedProgress =
      JSON.parse(localStorage.getItem("quizProgress")) || {};
    setState({ progress: savedProgress });
  };

  const saveProgress = () => {
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
  };

  // --- 初期化 ---
  const init = async () => {
    try {
      const [grammarRes, vocabularyRes, textRes] = await Promise.all([
        fetch("problems.json"),
        fetch("vocabulary.json"),
        fetch("text.json"),
      ]);

      if (!grammarRes.ok || !vocabularyRes.ok || !textRes.ok) {
        throw new Error("Failed to load one or more JSON files.");
      }

      const quizData = {
        grammar: await grammarRes.json(),
        vocabulary: await vocabularyRes.json(),
        text: await textRes.json(),
      };

      loadProgress();
      setState({ quizData, activeScreen: "start" });
    } catch (error) {
      appContainer.innerHTML = `<p class="text-red-500">問題データの読み込みに失敗しました。</p>`;
      console.error("Failed to load quiz data:", error);
    }
  };

  init();
});
