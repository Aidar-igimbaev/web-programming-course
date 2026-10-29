import { useState } from "react";
import {
  computeProgress,
  findAnswer,
  getMissingTasks,
  getTaskById,
  upsertAnswer,
  type Answer,
  type Task,
} from "./domain";
import { mainSet } from "./training-data";
import "./App.css";

type AttemptStatus = "in-progress" | "submitted";

type TaskListProps = {
  tasks: Task[];
  answers: Answer[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function TaskList({ tasks, answers, selectedId, onSelect }: TaskListProps) {
  const missingIds = new Set(getMissingTasks(mainSet, answers).map((task) => task.id));

  return (
    <ul className="task-list">
      {tasks.map((task, index) => (
        <li key={task.id}>
          <button
            type="button"
            className={task.id === selectedId ? "task-button active" : "task-button"}
            aria-current={task.id === selectedId ? "true" : undefined}
            onClick={() => onSelect(task.id)}
          >
            {index + 1}. {task.topic}
            <span className="task-state">
              {missingIds.has(task.id) ? " — не заполнено" : " — готово"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

type TaskCardProps = {
  task: Task;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
};

function TaskCard({ task, answer, onAnswer }: TaskCardProps) {
  const selectedOptionId =
    answer?.kind === "single-choice" ? answer.optionId : "";
  const text = answer?.kind === "short-text" ? answer.text : "";

  return (
    <article className="card">
      <p className="meta">
        {task.topic} ·{" "}
        {task.kind === "single-choice" ? "выбор ответа" : "текстовый ответ"}
      </p>

      <h2>{task.prompt}</h2>

      {task.code !== undefined && (
        <pre className="code">
          <code>{task.code}</code>
        </pre>
      )}

      {task.kind === "single-choice" ? (
        <fieldset className="options">
          <legend className="visually-hidden">Варианты ответа</legend>
          {task.options.map((option) => (
            <label key={option.id} className="option">
              <input
                type="radio"
                name={`task-${task.id}`}
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() =>
                  onAnswer({
                    taskId: task.id,
                    kind: "single-choice",
                    optionId: option.id,
                  })
                }
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      ) : (
        <label className="text-answer">
          Ваш ответ
          <textarea
            rows={6}
            value={text}
            onChange={(event) =>
              onAnswer({
                taskId: task.id,
                kind: "short-text",
                text: event.target.value,
              })
            }
          />
        </label>
      )}
    </article>
  );
}

type ReviewProps = {
  answers: Answer[];
  onRestart: () => void;
};

function describeAnswer(task: Task, answer: Answer | undefined): string {
  if (answer === undefined) return "";
  if (answer.kind === "single-choice" && task.kind === "single-choice") {
    return task.options.find((option) => option.id === answer.optionId)?.label ?? "";
  }
  if (answer.kind === "short-text") {
    return answer.text.trim();
  }
  return "";
}

function Review({ answers, onRestart }: ReviewProps) {
  const progress = computeProgress(mainSet, answers);

  return (
    <section className="card review">
      <p className="meta">Попытка завершена</p>
      <h2>Обзор ответов</h2>
      <p>
        Заполнено {progress.answered} из {progress.total}. Редактирование закрыто.
      </p>
      <ol className="review-list">
        {mainSet.tasks.map((task) => {
          const value = describeAnswer(task, findAnswer(answers, task.id));
          return (
            <li key={task.id}>
              <strong>{task.prompt}</strong>
              {task.code !== undefined && (
                <pre className="code">
                  <code>{task.code}</code>
                </pre>
              )}
              {value === "" ? (
                <p className="note">Ответ не дан.</p>
              ) : (
                <p className="review-answer">{value}</p>
              )}
            </li>
          );
        })}
      </ol>
      <button type="button" className="primary" onClick={onRestart}>
        Начать новую попытку
      </button>
    </section>
  );
}

export default function App() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedId, setSelectedId] = useState<string>(mainSet.tasks[0]?.id ?? "");
  const [status, setStatus] = useState<AttemptStatus>("in-progress");

  const selectedTask = getTaskById(mainSet, selectedId);
  const selectedIndex = mainSet.tasks.findIndex((task) => task.id === selectedId);

  const progress = computeProgress(mainSet, answers);
  const missing = getMissingTasks(mainSet, answers);

  function goTo(index: number) {
    const target = mainSet.tasks[index];
    if (target !== undefined) setSelectedId(target.id);
  }

  function handleFinish() {
    if (missing.length > 0) {
      const numbers = missing
        .map((task) => mainSet.tasks.findIndex((t) => t.id === task.id) + 1)
        .join(", ");
      const confirmed = window.confirm(
        `Не заполнены задания: ${numbers}. Завершить попытку?`,
      );
      if (!confirmed) return;
    }
    setStatus("submitted");
  }

  function handleRestart() {
    setAnswers([]);
    setSelectedId(mainSet.tasks[0]?.id ?? "");
    setStatus("in-progress");
  }

  if (mainSet.tasks.length === 0) {
    return (
      <main className="app">
        <h1>{mainSet.title}</h1>
        <p>В этом модуле пока нет заданий.</p>
      </main>
    );
  }

  if (status === "submitted") {
    return (
      <main className="app">
        <h1>{mainSet.title}</h1>
        <Review answers={answers} onRestart={handleRestart} />
      </main>
    );
  }

  return (
    <main className="app">
      <h1>{mainSet.title}</h1>

      <div className="progress-panel">
        <p aria-live="polite">
          Заполнено {progress.answered} из {progress.total}
        </p>
        <progress value={progress.answered} max={progress.total} />
        <p className="missing" aria-live="polite">
          {missing.length === 0
            ? "Все задания заполнены."
            : `Не заполнены: ${missing
                .map((task) => mainSet.tasks.findIndex((t) => t.id === task.id) + 1)
                .join(", ")}`}
        </p>
      </div>

      <div className="layout">
        <TaskList
          tasks={mainSet.tasks}
          answers={answers}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div>
          {selectedTask !== undefined ? (
            <TaskCard
              key={selectedTask.id}
              task={selectedTask}
              answer={findAnswer(answers, selectedTask.id)}
              onAnswer={(next) => setAnswers((prev) => upsertAnswer(prev, next))}
            />
          ) : (
            <p>Выберите задание из списка.</p>
          )}

          <div className="nav">
            <button
              type="button"
              onClick={() => goTo(selectedIndex - 1)}
              disabled={selectedIndex <= 0}
            >
              Назад
            </button>
            <button
              type="button"
              onClick={() => goTo(selectedIndex + 1)}
              disabled={selectedIndex >= mainSet.tasks.length - 1}
            >
              Далее
            </button>
            <button type="button" className="primary" onClick={handleFinish}>
              Завершить
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
