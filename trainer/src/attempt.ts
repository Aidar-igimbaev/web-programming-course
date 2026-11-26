import { getTaskById, upsertAnswer, type Answer, type TrainingSet } from "./domain";

export type AttemptStatus = "in-progress" | "submitted";

export type Attempt = {
  status: AttemptStatus;
  answers: Answer[];
};


export type AttemptChange =
  | { ok: true; attempt: Attempt }
  | { ok: false; reason: "submitted" | "unknown-task" };


export type AttemptAction =
  | { type: "answer"; answer: Answer }
  | { type: "clear"; taskId: string }
  | { type: "finish" }
  | { type: "restart" };

export function createAttempt(): Attempt {
  return { status: "in-progress", answers: [] };
}


export function answerTask(
  set: TrainingSet,
  attempt: Attempt,
  answer: Answer,
): AttemptChange {
  if (attempt.status === "submitted") return { ok: false, reason: "submitted" };
  if (getTaskById(set, answer.taskId) === undefined) {
    return { ok: false, reason: "unknown-task" };
  }
  return {
    ok: true,
    attempt: { ...attempt, answers: upsertAnswer(attempt.answers, answer) },
  };
}

export function clearAnswer(
  set: TrainingSet,
  attempt: Attempt,
  taskId: string,
): AttemptChange {
  if (attempt.status === "submitted") return { ok: false, reason: "submitted" };
  if (getTaskById(set, taskId) === undefined) {
    return { ok: false, reason: "unknown-task" };
  }
  return {
    ok: true,
    attempt: {
      ...attempt,
      answers: attempt.answers.filter((answer) => answer.taskId !== taskId),
    },
  };
}

export function finishAttempt(attempt: Attempt): AttemptChange {
  if (attempt.status === "submitted") return { ok: false, reason: "submitted" };
  return { ok: true, attempt: { ...attempt, status: "submitted" } };
}

export function reduceAttempt(
  set: TrainingSet,
  attempt: Attempt,
  action: AttemptAction,
): Attempt {
  if (action.type === "restart") return createAttempt();

  const change =
    action.type === "answer"
      ? answerTask(set, attempt, action.answer)
      : action.type === "clear"
        ? clearAnswer(set, attempt, action.taskId)
        : finishAttempt(attempt);

  return change.ok ? change.attempt : attempt;
}
