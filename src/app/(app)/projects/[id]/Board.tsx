'use client';

import { useState } from 'react';

import { TaskCard } from '@/components/tasks/TaskCard';
import { COLUMNS, TaskColumn } from '@/components/tasks/TaskColumn';
import { BoardSkeleton, EmptyState, ErrorPanel } from '@/components/ui';
import { useDeleteTask } from '@/hooks/useDeleteTask';
import { useTasks } from '@/hooks/useTasks';
import { useUpdateTaskStatus } from '@/hooks/useUpdateTaskStatus';
import type { TaskStatus } from '@/types/database';

/**
 * The board — TODO 3.
 *
 * A client component, because it needs hooks and click handlers. Notice how
 * small it is: all the data work lives in hooks, all the markup lives in
 * presentational components. This file only wires them together.
 */
export function Board({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading, error, refetch } = useTasks(projectId);

  const updateStatus = useUpdateTaskStatus(projectId);
  const removeTask = useDeleteTask(projectId);

  // Which card is being dragged. Pure UI state — it never goes near the
  // server, so plain useState is exactly right. Client state and server
  // state, side by side, each with the right tool.
  const [draggingId, setDraggingId] = useState<string | null>(null);

  /*
   * THE UX TRIANGLE — four states, on every screen that touches a network:
   * loading, error, empty, success.
   *
   * Juniors ship the success state and call it done. Then a user on slow
   * wi-fi sees a blank white page and assumes the app is broken.
   */
  if (isLoading) return <BoardSkeleton />;

  if (error) {
    return <ErrorPanel message={error.message} onRetry={() => refetch()} />;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Add your first one with the form above."
      />
    );
  }

  function handleDrop(status: TaskStatus) {
    if (!draggingId) return;

    const task = tasks?.find((candidate) => candidate.id === draggingId);
    setDraggingId(null);

    // Don't send a request for a no-op drop.
    if (!task || task.status === status) return;

    updateStatus.mutate({ id: draggingId, status });
  }

  return (
    <div className="board">
      {COLUMNS.map(({ status, label }) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <TaskColumn
            key={status}
            status={status}
            label={label}
            count={columnTasks.length}
            onDropTask={handleDrop}
          >
            {columnTasks.length === 0 && <p className="column__empty">Drop a task here</p>}

            {columnTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isDragging={draggingId === task.id}
                isPending={removeTask.isPending && removeTask.variables === task.id}
                onMove={(next) => updateStatus.mutate({ id: task.id, status: next })}
                onDelete={() => removeTask.mutate(task.id)}
                onDragStart={() => setDraggingId(task.id)}
                onDragEnd={() => setDraggingId(null)}
              />
            ))}
          </TaskColumn>
        );
      })}
    </div>
  );
}
