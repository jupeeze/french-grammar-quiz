export const StartScreen = (props, onLessonSelect) => {
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
      onLessonSelect(lesson);
    }
  });

  return container;
};
