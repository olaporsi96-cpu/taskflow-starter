'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateTaskStatus } from '@/lib/api/tasks';
import { taskKeys } from '@/lib/query-keys';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskStatus } from '@/types/database';

/**
 * Move a task between columns — TODO 7. OPTIMISTIC UPDATE.
 *
 * Without this, moving a card waits for a server in London: a visible pause
 * on campus wi-fi, a second or two on mobile data.
 *
 * Linear, Notion and Trello all feel instant. Their servers are not faster —
 * they update the screen BEFORE the server answers, and quietly put it back
 * if the server says no. That is all this is.
 */
export function useUpdateTaskStatus(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const queryKey = taskKeys.list(projectId);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(supabase, id, status),

    // 1. Runs BEFORE the request goes out.
    onMutate: async ({ id, status }) => {
      // A refetch may already be in flight carrying the OLD data. If it lands
      // after our optimistic edit it would overwrite it and the card would
      // visibly snap back. Cancel it first.
      await queryClient.cancelQueries({ queryKey });

      // Our undo button. Keep the truth before we tell the lie.
      const previous = queryClient.getQueryData<Task[]>(queryKey);

      // The lie: edit the cache directly. The UI updates this frame — no
      // network involved.
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((task) => (task.id === id ? { ...task, status } : task)),
      );

      // Whatever we return here arrives in onError as `context`.
      return { previous };
    },

    // 2. The server refused. Put it back.
    //    Being able to undo the lie is what separates an optimistic update
    //    from a bug.
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    // 3. Success or failure, resync with the server so the client's copy and
    //    the real data can never drift apart.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/*
 * WHEN TO USE THIS PATTERN
 *
 * Only where the mutation almost always succeeds, and the change is small and
 * reversible: status toggles, likes, reordering, marking as read.
 *
 * Never optimistically render "Payment successful".
 */
