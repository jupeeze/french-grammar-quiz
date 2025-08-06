export const renderResultScreen = (
  container,
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

  const percentage = Math.round((score / currentProblems.length) * 100);
  const quizTypeLabels = {
    grammar: "文法",
    vocabulary: "単語",
    text: "本文",
    debug: "デバッグ",
  };

  container.querySelector(
    "#result-lesson-info"
  ).textContent = `レッスン: ${currentLesson} (${quizTypeLabels[currentQuizType]})`;
  container.querySelector(
    "#score-text"
  ).textContent = `${score} / ${currentProblems.length}`;
  container.querySelector(
    "#percentage-text"
  ).textContent = `正答率: ${percentage}%`;

  const incorrectFeedbackContainer = container.querySelector(
    "#incorrect-feedback-container"
  );
  incorrectFeedbackContainer.innerHTML = "";
  if (incorrectAnswers.length > 0) {
    const incorrectFeedbackHTML = `
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
    incorrectFeedbackContainer.innerHTML = incorrectFeedbackHTML;
  }

  // --- イベントリスナー ---
  container.querySelector("#retry-quiz-btn").onclick = onRetry;
  const retryIncorrectBtn = container.querySelector("#retry-incorrect-btn");
  retryIncorrectBtn.onclick = onRetryIncorrect;
  retryIncorrectBtn.classList.toggle("hidden", incorrectAnswers.length === 0);
  container.querySelector("#back-to-home-btn").onclick = onBackToHome;
};
