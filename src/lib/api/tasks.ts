import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateTaskInput } from '@/lib/validation/task';
import type { Database, Task, TaskStatus } from '@/types/database';

/**
 * The data layer for tasks — TODO 1.
 *
 * Same rules as projects.ts: no React in this file, and the Supabase client
 * arrives as a parameter.
 */

export async function fetchTasks(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<Task[]> {
  // Read this out loud: SELECT * FROM tasks WHERE project_id = … ORDER BY …
  // It is SQL wearing a JavaScript costume. You are learning SQL right now.
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return data;
}

export async function createTask(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      created_by: userId,
      title: input.title,
      description: input.description || null,
      status: input.status,
      priority: input.priority,
    })
    // .select().single() asks the database to hand the new row back, with the
    // id and timestamps it generated. Without it you get no data returned.
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function updateTaskStatus(
  supabase: SupabaseClient<Database>,
  taskId: string,
  status: TaskStatus,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function deleteTask(
  supabase: SupabaseClient<Database>,
  taskId: string,
): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) throw new Error(error.message);
}
