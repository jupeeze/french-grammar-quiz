export const ResultScreen = (
  props,
  onRetry,
  onRetryIncorrect,
  onBackToHome
) => {
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

  let incorrectFeedbackHTML = "";
  if (incorrectAnswers.length > 0) {
    incorrectFeedbackHTML = `
        <h3 class="text-xl font-bold text-slate-700 mb-4 border-b-2 pb-2">間違えた問題</h3>
        <div class="space-y-6">
      ${incorrectAnswers
        .map((item) => {
          let userAnswerDisplay = "";
          if (item.problem.type === "form-quiz") {
            userAnswerDisplay = item.problem.sub_questions
              .map(
                (sq, i) =>
                  `<div class="flex justify-between items-center text-sm">
                     <span class="font-semibold text-slate-600">${
                       sq.label
                     }:</span>
                     <span class="${
                       item.userAnswers[i].trim().toLowerCase() ===
                       sq.answer.trim().toLowerCase()
                         ? "text-green-600"
                         : "text-red-600"
                     }">${item.userAnswers[i] || "（無回答）"}</span>
                     <span class="text-green-600 font-bold">${sq.answer}</span>
                   </div>`
              )
              .join("");
            userAnswerDisplay = `<div class="mt-2 space-y-1 p-2 bg-slate-50 rounded-md">${userAnswerDisplay}</div>`;
          } else {
            userAnswerDisplay = `
                <p class="text-sm">あなたの回答: <span class="text-red-600">${
                  item.userAnswer || "（無回答）"
                }</span></p>
                <p class="text-sm">正解: <span class="text-green-600 font-bold">${
                  item.problem.answer
                }</span></p>
            `;
          }

          return `
            <div class="p-4 bg-white rounded-lg border">
                <p class="font-semibold text-slate-800">${item.problem.question}</p>
                <div class="mt-2 text-left">${userAnswerDisplay}</div>
            </div>
          `;
        })
        .join("")}
        </div>
    `;
  }

  const quizTypeLabels = { grammar: "文法", vocabulary: "単語", text: "本文" };

  container.innerHTML = `
      <h2 class="text-2xl font-bold text-slate-800">クイズ終了！</h2>
      <p class="mt-2 text-slate-600">レッスン: ${currentLesson} (${
    quizTypeLabels[currentQuizType]
  })</p>
      <div class="my-8">
        <p class="text-lg">正解数</p>
        <p id="score-text" class="text-6xl font-bold text-indigo-600">${score} / ${
    currentProblems.length
  }</p>
        <p id="percentage-text" class="mt-2 text-lg text-slate-500">正答率: ${percentage}%</p>
      </div>
      <div id="incorrect-feedback-container" class="mt-8 text-left">${incorrectFeedbackHTML}</div>
      <div class="flex flex-col justify-center gap-4 mt-8">
          <button id="retry-quiz-btn" class="w-full py-3 px-6 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition-colors">もう一度挑戦</button>
          <button id="retry-incorrect-btn" class="w-full py-3 px-6 bg-amber-500 text-white font-semibold rounded-lg shadow-md hover:bg-amber-600 transition-colors ${
            incorrectAnswers.length > 0 ? "" : "hidden"
          }">間違えた問題だけ復習</button>
          <button id="back-to-home-btn" class="w-full py-3 px-6 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">レッスン選択に戻る</button>
      </div>
    `;

  // --- イベントリスナー ---
  container.querySelector("#retry-quiz-btn").onclick = onRetry;
  container.querySelector("#retry-incorrect-btn").onclick = onRetryIncorrect;
  container.querySelector("#back-to-home-btn").onclick = onBackToHome;

  return container;
};
