import { useReducer, useState } from "react";
import {
  computeProgress,
  findAnswer,
  getMissingTasks,
  getTaskById,
  isAnswerFilled,
  type Answer,
  type Task,
} from "./domain";
import { createAttempt, reduceAttempt, type AttemptAction } from "./attempt";
import { mainSet } from "./training-data";
import "./App.css";

type View = "tasks" | "overview";

// Reducer связывает React с чистыми правилами из attempt.ts.
function attemptReducer(
  attempt: ReturnType<typeof createAttempt>,
  action: AttemptAction,
) {
  return reduceAttempt(mainSet, attempt, action);
}

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
  onClear: () => void;
};

function TaskCard({ task, answer, onAnswer, onClear }: TaskCardProps) {
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

      <div className="card-actions">
        <button type="button" onClick={onClear} disabled={answer === undefined}>
          Очистить ответ
        </button>
      </div>
    </article>
  );
}

type OverviewProps = {
  answers: Answer[];
  editable: boolean;
  onOpen: (taskId: string) => void;
  onClear: (taskId: string) => void;
  onRestart: () => void;
};

function describeAnswer(task: Task, answer: Answer | undefined): string {
  if (answer === undefined || !isAnswerFilled(answer)) return "";
  if (answer.kind === "single-choice" && task.kind === "single-choice") {
    return task.options.find((option) => option.id === answer.optionId)?.label ?? "";
  }
  if (answer.kind === "short-text") {
    return answer.text.trim();
  }
  return "";
}

// Один и тот же обзор до и после завершения: кнопки действий есть только пока попытка открыта.
function Overview({ answers, editable, onOpen, onClear, onRestart }: OverviewProps) {
  const progress = computeProgress(mainSet, answers);

  return (
    <section className="card review">
      <p className="meta">{editable ? "Обзор попытки" : "Попытка завершена"}</p>
      <h2>Обзор ответов</h2>
      <p>
        Заполнено {progress.answered} из {progress.total}.{" "}
        {editable
          ? "Ответ можно очистить прямо отсюда."
          : "Редактирование закрыто."}
      </p>
      <ol className="review-list">
        {mainSet.tasks.map((task) => {
          const answer = findAnswer(answers, task.id);
          const value = describeAnswer(task, answer);
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
              {editable && (
                <div className="review-actions">
                  <button type="button" onClick={() => onOpen(task.id)}>
                    Открыть задание
                  </button>
                  <button
                    type="button"
                    onClick={() => onClear(task.id)}
                    disabled={answer === undefined}
                  >
                    Очистить ответ
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {!editable && (
        <button type="button" className="primary" onClick={onRestart}>
          Начать новую попытку
        </button>
      )}
    </section>
  );
}

export default function App() {
  // Одна попытка (ответы и статус) у одного владельца. Все действия идут через dispatch.
  const [attempt, dispatch] = useReducer(attemptReducer, createAttempt());
  // Местные детали интерфейса: какое задание открыто и что показано, карточка или обзор.
  const [selectedId, setSelectedId] = useState<string>(mainSet.tasks[0]?.id ?? "");
  const [view, setView] = useState<View>("tasks");

  const answers = attempt.answers;
  const selectedTask = getTaskById(mainSet, selectedId);
  const selectedIndex = mainSet.tasks.findIndex((task) => task.id === selectedId);

  // Производные значения: считаются из answers, отдельно не хранятся.
  const progress = computeProgress(mainSet, answers);
  const missing = getMissingTasks(mainSet, answers);
  const missingNumbers = missing
    .map((task) => mainSet.tasks.findIndex((t) => t.id === task.id) + 1)
    .join(", ");

  function goTo(index: number) {
    const target = mainSet.tasks[index];
    if (target !== undefined) setSelectedId(target.id);
  }

  function handleFinish() {
    if (missing.length > 0) {
      const confirmed = window.confirm(
        `Не заполнены задания: ${missingNumbers}. Завершить попытку?`,
      );
      if (!confirmed) return;
    }
    dispatch({ type: "finish" });
  }

  function handleRestart() {
    dispatch({ type: "restart" });
    setSelectedId(mainSet.tasks[0]?.id ?? "");
    setView("tasks");
  }

  function handleOpenFromOverview(taskId: string) {
    setSelectedId(taskId);
    setView("tasks");
  }

  if (mainSet.tasks.length === 0) {
    return (
      <main className="app">
        <h1>{mainSet.title}</h1>
        <p>В этом модуле пока нет заданий.</p>
      </main>
    );
  }

  if (attempt.status === "submitted") {
    return (
      <main className="app">
        <h1>{mainSet.title}</h1>
        <Overview
          answers={answers}
          editable={false}
          onOpen={handleOpenFromOverview}
          onClear={(taskId) => dispatch({ type: "clear", taskId })}
          onRestart={handleRestart}
        />
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
            : `Не заполнены: ${missingNumbers}`}
        </p>
      </div>

      <div className="view-switch">
        <button
          type="button"
          aria-pressed={view === "tasks"}
          onClick={() => setView("tasks")}
        >
          Задания
        </button>
        <button
          type="button"
          aria-pressed={view === "overview"}
          onClick={() => setView("overview")}
        >
          Обзор ответов
        </button>
      </div>

      {view === "overview" ? (
        <>
          <Overview
            answers={answers}
            editable={true}
            onOpen={handleOpenFromOverview}
            onClear={(taskId) => dispatch({ type: "clear", taskId })}
            onRestart={handleRestart}
          />
          <div className="nav">
            <button type="button" className="primary" onClick={handleFinish}>
              Завершить
            </button>
          </div>
        </>
      ) : (
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
                onAnswer={(answer) => dispatch({ type: "answer", answer })}
                onClear={() => dispatch({ type: "clear", taskId: selectedTask.id })}
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
      )}
    </main>
  );
}
