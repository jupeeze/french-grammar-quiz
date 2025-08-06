export const QuizTypeSelection = (currentQuizType, quizData, onTypeSelect) => {
  const container = document.createElement("div");
  container.className =
    "w-fit mx-auto my-8 bg-white p-2 rounded-xl shadow-md flex gap-2 justify-center";

  const types = ["grammar", "vocabulary", "text"];
  if (quizData && quizData.debug) {
    types.push("debug");
  }

  const typeLabels = {
    grammar: "文法",
    vocabulary: "単語",
    text: "本文",
    debug: "デバッグ",
  };

  types.forEach((type) => {
    const button = document.createElement("button");
    button.dataset.type = type;
    button.textContent = typeLabels[type];
    button.className = `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      currentQuizType === type
        ? "bg-indigo-600 text-white"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
    }`;
    button.onclick = () => onTypeSelect(type);
    container.appendChild(button);
  });

  return container;
};
