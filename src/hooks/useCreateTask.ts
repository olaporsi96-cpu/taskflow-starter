'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTask } from '@/lib/api/tasks';
import { taskKeys } from '@/lib/query-keys';
import { createClient } from '@/lib/supabase/client';
import type { CreateTaskInput } from '@/lib/validation/task';

/**
 * Create a task — TODO 6.
 *
 * useQuery reads. useMutation writes. That is the whole distinction.
 */
export function useCreateTask(projectId: string, userId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(supabase, projectId, userId, input),

    onSuccess: () => {
      /*
       * The line that makes the app feel alive.
       *
       * In English: "the list at this address is now out of date — anyone
       * showing it, go and get it again." React Query refetches, and every
       * component using that key updates itself.
       *
       * Notice what you did NOT do: no setTasks([...tasks, newTask]), no
       * lifting state to a common parent, no passing a callback down three
       * levels. You told the cache the truth and the UI followed.
       */
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
    },
  });
}
