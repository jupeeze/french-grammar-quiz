document.addEventListener("DOMContentLoaded", () => {
  // --- DOM要素 ---
  const appContainer = document.getElementById("app-container");

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
  };

  // --- 状態更新関数 ---
  const setState = (newState) => {
    Object.assign(state, newState);
    render();
  };

  // --- コンポーネント ---

  /**
   * クイズ種別選択ボタン コンポーネント
   */
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
   * クイズ画面 コンポーネント (長いため主要部分のみ抜粋)
   * ※ script.js内の displayProblem, checkAnswer, nextQuestion などのロジックを統合
   */
  const QuizScreen = (props) => {
    // (この部分は長くなるため、元のscript.jsのロジックを参考に構築します)
    // QuizScreenは内部で問題表示、回答チェック、次の問題への遷移を管理する
    // 状態はすべてpropsとして受け取る
    const container = document.createElement("div");
    container.id = "quiz-screen";
    container.className = "bg-white p-6 sm:p-8 rounded-2xl shadow-lg";

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

    currentProblemIndex++;
    if (currentProblemIndex < currentQuizProblems.length) {
      displayProblem();
    } else {
      showResult();
    }

    container.innerHTML = `
        <p>クイズ画面はここにレンダリングされます。</p>
        <p>現在の問題: ${props.currentProblemIndex + 1} / ${
      props.currentProblems.length
    }</p>
        <button id="quit-btn">終了</button>
      `;

    container.querySelector("#quit-btn").onclick = () => {
      setState({ activeScreen: "start" });
    };

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
      const problemsForLesson = quizData[currentQuizType].filter(
        (p) => p.lesson === currentLesson
      );
      setupQuiz(problemsForLesson, currentLesson);
    };
    container.querySelector("#retry-incorrect-btn").onclick = () => {
      const incorrectProblems = incorrectAnswers.map((item) => item.problem);
      const reviewLessonName =
        typeof currentLesson === "string" && currentLesson.includes("(復習)")
          ? currentLesson
          : `${currentLesson} (復習)`;
      setupQuiz(incorrectProblems, reviewLessonName);
    };
    container.querySelector("#back-to-home-btn").onclick = () => {
      loadProgress(); // progressを更新してスタート画面へ
      setState({ activeScreen: "start" });
    };

    return container;
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
