import type { TaskBoardItem } from "@/api/adapters/tasks";
import { TaskCard } from "./task-card";

interface TaskListCardsProps {
  tasks: TaskBoardItem[];
  onTaskClick: (taskId: string) => void;
}

export const TaskListCards = ({ tasks, onTaskClick }: TaskListCardsProps) => (
  <div className="space-y-2 block md:hidden">
    {tasks.map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        onClick={() => onTaskClick(task.id)}
      />
    ))}
  </div>
);
