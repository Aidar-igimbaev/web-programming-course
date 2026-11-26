
import { computeProgress, getMissingTasks } from "./domain";
import {
  answerTask,
  clearAnswer,
  createAttempt,
  finishAttempt,
  reduceAttempt,
  type Attempt,
} from "./attempt";
import { mainSet } from "./training-data";

let failed = 0;
function check(label: string, condition: boolean) {
  if (!condition) failed += 1;
  console.log(`${condition ? "OK  " : "FAIL"} ${label}`);
}

function must(change: ReturnType<typeof answerTask>): Attempt {
  if (!change.ok) throw new Error(`ожидался успех, а пришёл отказ: ${change.reason}`);
  return change.attempt;
}


let attempt = createAttempt();
attempt = must(answerTask(mainSet, attempt, { taskId: "ts-1", kind: "single-choice", optionId: "a" }));
attempt = must(answerTask(mainSet, attempt, { taskId: "ts-1", kind: "single-choice", optionId: "b" }));
check("один ответ на задание", attempt.answers.length === 1);


attempt = must(answerTask(mainSet, attempt, { taskId: "react-1", kind: "short-text", text: "   " }));
check("пробелы не входят в прогресс", computeProgress(mainSet, attempt.answers).answered === 1);
check("пробельное задание в пропусках", getMissingTasks(mainSet, attempt.answers).map((t) => t.id).join() === "react-1");


attempt = must(answerTask(mainSet, attempt, { taskId: "react-1", kind: "short-text", text: "props" }));
check("после текста пропусков нет", getMissingTasks(mainSet, attempt.answers).length === 0);
const before = attempt;
attempt = must(clearAnswer(mainSet, attempt, "react-1"));
check("очистка не меняет старую попытку", before.answers.length === 2);
check("очистка убирает ответ", attempt.answers.length === 1);
check("после очистки прогресс 1 из 2", computeProgress(mainSet, attempt.answers).answered === 1);
check("после очистки задание снова в пропусках", getMissingTasks(mainSet, attempt.answers).map((t) => t.id).join() === "react-1");


const finished = must(finishAttempt(attempt));
check("статус submitted", finished.status === "submitted");
check("ответы после завершения те же", finished.answers === attempt.answers);


const late1 = answerTask(mainSet, finished, { taskId: "ts-1", kind: "single-choice", optionId: "c" });
const late2 = clearAnswer(mainSet, finished, "ts-1");
const late3 = finishAttempt(finished);
check("answer после submitted отклонён", !late1.ok && late1.reason === "submitted");
check("clear после submitted отклонён", !late2.ok && late2.reason === "submitted");
check("повторное завершение отклонено", !late3.ok && late3.reason === "submitted");


const unknown = clearAnswer(mainSet, createAttempt(), "no-such-task");
check("неизвестное задание отклонено", !unknown.ok && unknown.reason === "unknown-task");

let state = createAttempt();
state = reduceAttempt(mainSet, state, { type: "answer", answer: { taskId: "ts-1", kind: "single-choice", optionId: "b" } });
state = reduceAttempt(mainSet, state, { type: "finish" });
const stateAfterClear = reduceAttempt(mainSet, state, { type: "clear", taskId: "ts-1" });
check("reducer: clear после submitted ничего не меняет", stateAfterClear === state && state.answers.length === 1);
state = reduceAttempt(mainSet, state, { type: "restart" });
check("reducer: restart даёт чистую попытку", state.status === "in-progress" && state.answers.length === 0);

console.log(failed === 0 ? "\nВсе проверки пройдены" : `\nПровалено проверок: ${failed}`);
