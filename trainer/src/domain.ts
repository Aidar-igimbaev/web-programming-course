export type ChoiceOption = {
  id: string;
  label: string;
};

type TaskCommon = {
  id: string;
  topic: string;
  prompt: string;
  code?: string;
};

export type SingleChoiceTask = TaskCommon & {
  kind: "single-choice";
  options: ChoiceOption[];
};

export type ShortTextTask = TaskCommon & {
  kind: "short-text";
};

export type Task = SingleChoiceTask | ShortTextTask;

export type TrainingSet = {
  id: string;
  title: string;
  tasks: Task[];
};

export type SingleChoiceAnswer = {
  taskId: string;
  kind: "single-choice";
  optionId: string;
};

export type ShortTextAnswer = {
  taskId: string;
  kind: "short-text";
  text: string;
};

export type Answer = SingleChoiceAnswer | ShortTextAnswer;

export type Progress = {
  answered: number;
  total: number;
};

function isAnswerFilled(answer: Answer): boolean {
  if (answer.kind === "single-choice") {
    return answer.optionId !== "";
  }
  return answer.text.trim() !== "";
}

export function getTaskById(set: TrainingSet, taskId: string): Task | undefined {
  return set.tasks.find((task) => task.id === taskId);
}

export function selectTasksByTopic(set: TrainingSet, topic: string): Task[] {
  return set.tasks.filter((task) => task.topic === topic);
}

export function computeProgress(set: TrainingSet, answers: Answer[]): Progress {
  const answered = set.tasks.filter((task) =>
    answers.some((answer) => answer.taskId === task.id && isAnswerFilled(answer)),
  ).length;

  return { answered, total: set.tasks.length };
}
