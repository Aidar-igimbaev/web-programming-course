import { useState } from "react";
import { getTaskById, type Task } from "./domain";
import { mainSet } from "./training-data";
import "./App.css";

type TaskListProps = {
  tasks: Task[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function TaskList({ tasks, selectedId, onSelect }: TaskListProps) {
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
          </button>
        </li>
      ))}
    </ul>
  );
}

type TaskCardProps = {
  task: Task;
};

function TaskCard({ task }: TaskCardProps) {
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
        <ul className="options">
          {task.options.map((option) => (
            <li key={option.id}>{option.label}</li>
          ))}
        </ul>
      ) : (
        <p className="note">Это задание с текстовым ответом.</p>
      )}
    </article>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string>(mainSet.tasks[0]?.id ?? "");

  const selectedTask = getTaskById(mainSet, selectedId);

  return (
    <main className="app">
      <h1>{mainSet.title}</h1>

      {mainSet.tasks.length === 0 ? (
        <p>В этом модуле пока нет заданий.</p>
      ) : (
        <div className="layout">
          <TaskList
            tasks={mainSet.tasks}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {selectedTask !== undefined ? (
            <TaskCard task={selectedTask} />
          ) : (
            <p>Выберите задание из списка.</p>
          )}
        </div>
      )}
    </main>
  );
}
