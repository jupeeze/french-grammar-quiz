import { state, setState } from "./state.js";

export async function loadQuizData() {
  try {
    const [grammarRes, vocabularyRes, textRes] = await Promise.all([
      fetch("data/problems.json"),
      fetch("data/vocabulary.json"),
      fetch("data/text.json"),
    ]);

    if (!grammarRes.ok || !vocabularyRes.ok || !textRes.ok) {
      throw new Error("Failed to load one or more JSON files.");
    }

    const quizData = {
      grammar: await grammarRes.json(),
      vocabulary: await vocabularyRes.json(),
      text: await textRes.json(),
    };
    return quizData;
  } catch (error) {
    console.error("Failed to load quiz data:", error);
    throw error; // エラーを呼び出し元に伝える
  }
}

export function loadProgress() {
  const savedProgress = JSON.parse(localStorage.getItem("quizProgress")) || {};
  setState({ progress: savedProgress });
}

export function saveProgress() {
  const { currentQuizType, currentLesson, score, currentProblems } = state;
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
    total: currentProblems.length,
    percentage: Math.round((score / currentProblems.length) * 100),
  };
  localStorage.setItem("quizProgress", JSON.stringify(progressData));
}
