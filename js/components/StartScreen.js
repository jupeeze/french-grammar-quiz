export const renderStartScreen = (container, props, onLessonSelect) => {
  const { quizData, currentQuizType, progress } = props;
  const grid = container.querySelector("#lesson-grid");
  grid.innerHTML = "";

  const problems = quizData[currentQuizType];
  const lessons = problems
    ? [...new Set(problems.map((p) => p.lesson))].sort((a, b) => a - b)
    : [];

  if (lessons.length > 0) {
    lessons.forEach((lesson) => {
      const lessonProgress = progress[currentQuizType]?.[lesson] || {
        percentage: 0,
      };
      const button = document.createElement("button");
      button.dataset.lesson = lesson;
      button.className =
        "p-4 bg-white border-2 border-slate-200 rounded-lg text-lg font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-500 transition-all duration-200 flex flex-col items-center justify-center";
      button.innerHTML = `
        <span>Lesson ${lesson}</span>
        <div class="mt-2 w-full bg-slate-200 rounded-full h-2.5">
            <div class="bg-indigo-500 h-2.5 rounded-full" style="width: ${lessonProgress.percentage}%"></div>
        </div>
        <span class="text-xs text-slate-500 mt-1">${lessonProgress.percentage}%</span>
      `;
      grid.appendChild(button);
    });
  } else {
    grid.innerHTML = `<p class="text-slate-500 col-span-full">このカテゴリーには問題がありません。</p>`;
  }

  grid.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-lesson]");
    if (button) {
      const lesson = Number(button.dataset.lesson);
      onLessonSelect(lesson);
    }
  });
};
