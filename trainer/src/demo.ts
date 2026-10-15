import {
  computeProgress,
  getTaskById,
  selectTasksByTopic,
  type Answer,
  type Progress,
  type TrainingSet,
} from "./domain.js";

const webBasics: TrainingSet = {
  id: "web-basics",
  title: "Основы веб-программирования",
  tasks: [
    {
      id: "ts-1",
      kind: "single-choice",
      topic: "typescript",
      prompt: "Что выведет этот JavaScript-код?",
      code: 'console.log("10" * 5);',
      options: [
        { id: "a", label: "105" },
        { id: "b", label: "50" },
        { id: "c", label: "Ошибка" },
      ],
    },
    {
      id: "react-1",
      kind: "short-text",
      topic: "react",
      prompt: "Объясните, чем props компонента отличаются от его состояния.",
    },
  ],
};

const cssBasics: TrainingSet = {
  id: "css-basics",
  title: "Основы CSS",
  tasks: [
    {
      id: "css-1",
      kind: "short-text",
      topic: "css",
      prompt: "Для чего нужен CSS?",
    },
  ],
};

const emptySet: TrainingSet = {
  id: "empty",
  title: "Пустой набор",
  tasks: [],
};

const noAnswers: Answer[] = [];

const oneAnswer: Answer[] = [
  { taskId: "ts-1", kind: "single-choice", optionId: "b" },
];

const fullAnswers: Answer[] = [
  { taskId: "ts-1", kind: "single-choice", optionId: "b" },
  { taskId: "react-1", kind: "short-text", text: "Props приходят снаружи" },
];

const blankTextAnswers: Answer[] = [
  { taskId: "ts-1", kind: "single-choice", optionId: "a" },
  { taskId: "react-1", kind: "short-text", text: "   " },
];

const foreignAnswers: Answer[] = [
  { taskId: "css-1", kind: "short-text", text: "Ответ на задание из другого набора" },
];

function formatProgress(progress: Progress): string {
  return `${progress.answered} из ${progress.total}`;
}

const setBefore = JSON.stringify(webBasics);
const answersBefore = JSON.stringify(fullAnswers);


console.log("=== Поиск задания по id ===");
console.log("ts-1:", getTaskById(webBasics, "ts-1")?.prompt);
console.log("react-1:", getTaskById(webBasics, "react-1")?.prompt);
console.log("no-such-id:", getTaskById(webBasics, "no-such-id"));
console.log("пустой набор:", getTaskById(emptySet, "ts-1"));

console.log("\n=== Фильтр по topic ===");
console.log("typescript:", selectTasksByTopic(webBasics, "typescript").map((t) => t.id));
console.log("react:", selectTasksByTopic(webBasics, "react").map((t) => t.id));
console.log("css (нет совпадений):", selectTasksByTopic(webBasics, "css").map((t) => t.id));
console.log("пустой набор:", selectTasksByTopic(emptySet, "typescript").map((t) => t.id));

console.log("\n=== Прогресс ===");
console.log("пустой набор:", formatProgress(computeProgress(emptySet, noAnswers)));
console.log("нет ответов:", formatProgress(computeProgress(webBasics, noAnswers)));
console.log("один ответ:", formatProgress(computeProgress(webBasics, oneAnswer)));
console.log("полный набор:", formatProgress(computeProgress(webBasics, fullAnswers)));
console.log("текст из пробелов:", formatProgress(computeProgress(webBasics, blankTextAnswers)));
console.log("чужой taskId:", formatProgress(computeProgress(webBasics, foreignAnswers)));
console.log("второй набор:", formatProgress(computeProgress(cssBasics, foreignAnswers)));

console.log("\n=== Неизменность входов ===");
console.log("набор не изменился:", JSON.stringify(webBasics) === setBefore);
console.log("ответы не изменились:", JSON.stringify(fullAnswers) === answersBefore);
