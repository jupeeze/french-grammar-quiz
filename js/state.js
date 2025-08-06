export const state = {
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
  isAnswered: false,
};

export function setState(newState) {
  Object.assign(state, newState);
}
