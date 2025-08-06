import { state, setState } from "./state.js";
import { loadQuizData, loadProgress, saveProgress } from "./api.js";
import { renderQuizTypeSelection } from "./components/QuizTypeSelection.js";
import { renderStartScreen } from "./components/StartScreen.js";
import { renderQuizScreen } from "./components/QuizScreen.js";
import { renderResultScreen } from "./components/ResultScreen.js";

const appContainer = document.getElementById("app-container");
const templates = {
  loading: document.getElementById("loading-screen-template"),
  start: document.getElementById("start-screen-template"),
  quiz: document.getElementById("quiz-screen-template"),
  result: document.getElementById("result-screen-template"),
  error: document.getElementById("error-screen-template"),
};

// --- イベントハンドラ ---

function handleTypeSelect(type) {
  setState({ currentQuizType: type });
  render();
}

function handleLessonSelect(lesson) {
  const problemsForLesson = state.quizData[state.currentQuizType]
    .filter((p) => p.lesson === lesson)
    .sort(() => 0.5 - Math.random());

  setState({
    activeScreen: "quiz",
    currentLesson: lesson,
    currentProblems: problemsForLesson,
    currentProblemIndex: 0,
    score: 0,
    incorrectAnswers: [],
    isAnswered: false,
    feedback: null,
  });
  render();
}

function handleAnswer(userAnswer) {
  if (state.isAnswered) return;

  const problem = state.currentProblems[state.currentProblemIndex];
  let isCorrect = false;
  let userAnswersForForm = [];

  if (problem.type === "form-quiz") {
    let allCorrect = true;
    const inputs = appContainer.querySelectorAll("#answer-options input");
    problem.sub_questions.forEach((sq, index) => {
      const input = inputs[index];
      const value = input.value.trim();
      userAnswersForForm.push(value);
      if (value.toLowerCase() !== sq.answer.trim().toLowerCase()) {
        allCorrect = false;
      }
    });
    isCorrect = allCorrect;
  } else {
    isCorrect =
      userAnswer.trim().toLowerCase() === problem.answer.trim().toLowerCase();
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
      feedbackMessage = "不正解... 赤い箇所を確認してください。";
    } else {
      incorrectData.userAnswer = userAnswer;
    }
    newIncorrectAnswers.push(incorrectData);
  }

  setState({
    score: newScore,
    incorrectAnswers: newIncorrectAnswers,
    isAnswered: true,
    feedback: { isCorrect, message: feedbackMessage },
  });
  render();
}

function handleNextQuestion() {
  if (state.currentProblemIndex + 1 < state.currentProblems.length) {
    setState({
      currentProblemIndex: state.currentProblemIndex + 1,
      isAnswered: false,
      feedback: null,
    });
  } else {
    saveProgress();
    setState({ activeScreen: "result" });
  }
  render();
}

function handleQuit() {
  loadProgress();
  setState({ activeScreen: "start" });
  render();
}

function handleRetry() {
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
  render();
}

function handleRetryIncorrect() {
  const incorrectProblems = state.incorrectAnswers
    .map((item) => item.problem)
    .sort(() => 0.5 - Math.random());
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
  render();
}

function handleBackToHome() {
  loadProgress();
  setState({ activeScreen: "start" });
  render();
}

// --- メインレンダリング関数 ---
function render() {
  const screen = state.activeScreen;
  const template = templates[screen];

  if (!template) {
    showError("エラーが発生しました。画面をリロードしてください。");
    return;
  }

  appContainer.innerHTML = "";
  const screenElement = template.content.cloneNode(true).firstElementChild;
  appContainer.appendChild(screenElement);

  switch (screen) {
    case "start":
      renderQuizTypeSelection(
        screenElement.querySelector("#quiz-type-container"),
        state,
        handleTypeSelect
      );
      renderStartScreen(screenElement, state, handleLessonSelect);
      break;
    case "quiz":
      renderQuizScreen(
        screenElement,
        state,
        handleAnswer,
        handleNextQuestion,
        handleQuit
      );
      break;
    case "result":
      renderResultScreen(
        screenElement,
        state,
        handleRetry,
        handleRetryIncorrect,
        handleBackToHome
      );
      break;
    case "loading":
      // 何もしない（テンプレートが表示されるだけ）
      break;
  }
}

function showError(message) {
  appContainer.innerHTML = "";
  const errorElement =
    templates.error.content.cloneNode(true).firstElementChild;
  errorElement.querySelector("p").textContent = message;
  appContainer.appendChild(errorElement);
}

// --- 初期化 ---
async function init() {
  render(); // 初期ローディングメッセージを表示
  try {
    const quizData = await loadQuizData();
    loadProgress();
    setState({ quizData, activeScreen: "start" });
  } catch (error) {
    console.error(error);
    showError(
      "問題データの読み込みに失敗しました。ページを再読み込みしてください。"
    );
    return;
  }
  render();
}

// アプリケーションを開始
init();
