import { state, setState } from "./state.js";
import { loadQuizData, loadProgress, saveProgress } from "./api.js";
import { QuizTypeSelection } from "./components/QuizTypeSelection.js";
import { StartScreen } from "./components/StartScreen.js";
import { QuizScreen } from "./components/QuizScreen.js";
import { ResultScreen } from "./components/ResultScreen.js";

const appContainer = document.getElementById("app-container");

// --- イベントハンドラ ---

/**
 * クイズタイプが選択されたときの処理
 * @param {string} type - 選択されたクイズタイプ ('grammar', 'vocabulary', 'text')
 */
function handleTypeSelect(type) {
  setState({ currentQuizType: type });
  render();
}

/**
 * レッスンが選択されたときの処理
 * @param {number} lesson - 選択されたレッスン番号
 */
function handleLessonSelect(lesson) {
  const problemsForLesson = state.quizData[state.currentQuizType]
    .filter((p) => p.lesson === lesson)
    .sort(() => 0.5 - Math.random()); // 問題をシャッフル

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

/**
 * ユーザーが回答を送信したときの処理
 * @param {string | null} userAnswer - ユーザーの回答。form-quizの場合はnull
 */
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
  } else if (problem.type === "scramble") {
    isCorrect = userAnswer.trim() === problem.answer.trim();
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

/**
 * 「次へ」ボタンが押されたときの処理
 */
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

/**
 * 「終了する」ボタンが押されたときの処理
 */
function handleQuit() {
  loadProgress();
  setState({ activeScreen: "start" });
  render();
}

/**
 * 「もう一度挑戦」ボタンが押されたときの処理
 */
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

/**
 * 「間違えた問題だけ復習」ボタンが押されたときの処理
 */
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

/**
 * 「レッスン選択に戻る」ボタンが押されたときの処理
 */
function handleBackToHome() {
  loadProgress();
  setState({ activeScreen: "start" });
  render();
}

// --- メインレンダリング関数 ---
function render() {
  appContainer.innerHTML = "";

  switch (state.activeScreen) {
    case "loading":
      appContainer.innerHTML = `<div class="text-center p-8 bg-white rounded-2xl shadow-lg"><p>問題データを読み込んでいます...</p></div>`;
      break;
    case "start":
      appContainer.appendChild(
        QuizTypeSelection(
          state.currentQuizType,
          state.quizData,
          handleTypeSelect
        )
      );
      appContainer.appendChild(StartScreen(state, handleLessonSelect));
      break;
    case "quiz":
      appContainer.appendChild(
        QuizScreen(state, handleAnswer, handleNextQuestion, handleQuit)
      );
      break;
    case "result":
      appContainer.appendChild(
        ResultScreen(state, handleRetry, handleRetryIncorrect, handleBackToHome)
      );
      break;
    default:
      appContainer.innerHTML = `<p class="text-red-500">エラーが発生しました。画面をリロードしてください。</p>`;
  }
}

// --- 初期化 ---
async function init() {
  render(); // 初期ローディングメッセージを表示
  try {
    const quizData = await loadQuizData();
    loadProgress();
    setState({ quizData, activeScreen: "start" });
  } catch (error) {
    appContainer.innerHTML = `<div class="text-center p-8 bg-white rounded-2xl shadow-lg"><p class="text-red-500">問題データの読み込みに失敗しました。ページを再読み込みしてください。</p></div>`;
  } finally {
    render();
  }
}

// アプリケーションを開始
init();
