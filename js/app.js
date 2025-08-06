import { state, setState } from "./state.js";
import { loadQuizData, loadProgress, saveProgress } from "./api.js";
import { QuizTypeSelection } from "./components/QuizTypeSelection.js";
import { StartScreen } from "./components/StartScreen.js";
import { QuizScreen } from "./components/QuizScreen.js";
import { ResultScreen } from "./components/ResultScreen.js";

const appContainer = document.getElementById("app-container");

// --- イベントハンドラ ---

function handleTypeSelect(type) {
  setState({ currentQuizType: type });
  render();
}

function handleLessonSelect(lesson) {
  const problemsForLesson = state.quizData[state.currentQuizType]
    .filter((p) => p.lesson === lesson)
    .sort(() => 0.5 - Math.random()); // Shuffle

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
  // ... 元の script.js から checkAnswer のロジックをここに移動 ...
  // state を更新した後、render() を呼び出す
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

// --- メインレンダリング関数 ---
function render() {
  appContainer.innerHTML = "";

  switch (state.activeScreen) {
    case "loading":
      appContainer.innerHTML = `<p>問題データを読み込んでいます...</p>`;
      break;
    case "start":
      appContainer.appendChild(
        QuizTypeSelection(state.currentQuizType, handleTypeSelect)
      );
      appContainer.appendChild(StartScreen(state, handleLessonSelect));
      break;
    case "quiz":
      appContainer.appendChild(
        QuizScreen(state, handleAnswer, handleNextQuestion, handleQuit)
      );
      break;
    case "result":
      appContainer.appendChild(ResultScreen(state, ...handlers));
      break;
  }
}

// --- 初期化 ---
async function init() {
  try {
    const quizData = await loadQuizData();
    loadProgress();
    setState({ quizData, activeScreen: "start" });
  } catch (error) {
    appContainer.innerHTML = `<p class="text-red-500">問題データの読み込みに失敗しました。</p>`;
  } finally {
    render();
  }
}

init();
