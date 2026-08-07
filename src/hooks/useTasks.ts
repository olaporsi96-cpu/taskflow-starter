'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchTasks } from '@/lib/api/tasks';
import { taskKeys } from '@/lib/query-keys';
import { createClient } from '@/lib/supabase/client';

/**
 * Read the tasks for one project — TODO 2.
 *
 * Compare with Day 2:
 *   useState for data, useState for loading, useState for error, a useEffect,
 *   and a cleanup flag so a slow response cannot overwrite a fast one.
 *
 * All of it, gone. And this is a custom hook (Day 2's lesson), so every
 * component that needs tasks calls `useTasks(projectId)` and nobody repeats
 * a fetch.
 */
export function useTasks(projectId: string) {
  const supabase = createClient();

  return useQuery({
    // WHERE it lives in the cache
    queryKey: taskKeys.list(projectId),
    // HOW to get it if the cache is cold or stale
    queryFn: () => fetchTasks(supabase, projectId),
  });
}
