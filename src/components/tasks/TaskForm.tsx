'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { useCreateTask } from '@/hooks/useCreateTask';
import { createTaskSchema, type CreateTaskInput } from '@/lib/validation/task';
import { TASK_PRIORITIES } from '@/types/database';

/**
 * New-task form — TODO 5.
 *
 * Count the lines against `app/login/LoginForm.tsx`. That one has two fields
 * and five useStates. This one has four fields, full validation, accessible
 * error messages and a disabled-while-saving button — and it is shorter.
 */
export function TaskForm({ projectId, userId }: { projectId: string; userId: string }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    // The bridge. React Hook Form knows nothing about Zod; Zod knows nothing
    // about React. The resolver is the adapter between them — which is why
    // you could swap Zod for Yup or Valibot without touching this form.
    resolver: zodResolver(createTaskSchema),

    // ALWAYS set these. Leave them out and the inputs start as `undefined`,
    // React calls them uncontrolled, and you get the yellow console warning
    // the first time somebody types.
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
    },
  });

  const createTask = useCreateTask(projectId, userId);

  async function onSubmit(values: CreateTaskInput) {
    try {
      // mutateAsync, not mutate: it returns a promise, so `await` works and
      // `isSubmitting` stays true until the server has actually answered.
      // Unlike mutate it also throws, hence the try/catch.
      await createTask.mutateAsync(values);
      reset();
    } catch (error) {
      // A form-level error, not tied to any one field. This is where a
      // failed request or a rejected RLS policy surfaces to the user.
      setError('root', {
        message: error instanceof Error ? error.message : 'Could not save the task.',
      });
    }
  }

  return (
    /*
      noValidate turns off the browser's own validation bubbles so that Zod is
      the only voice in the room.
    */
    <form className="form card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Title" htmlFor="title" error={errors.title?.message}>
        <Input
          id="title"
          placeholder="What needs doing?"
          /*
            That spread is FOUR things at once: name, onChange, onBlur and a
            ref. RHF keeps the value in the ref, not in state — so typing here
            re-renders nothing. Day 1's counter re-rendered on every keystroke.
            A twenty-field form doing that on a cheap Android phone is exactly
            why forms feel laggy.
          */
          {...register('title')}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        hint="Optional."
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          rows={2}
          placeholder="Any detail worth remembering…"
          {...register('description')}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
      </Field>

      <div className="form__row">
        <Field label="Priority" htmlFor="priority" error={errors.priority?.message}>
          <Select id="priority" {...register('priority')}>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Column" htmlFor="status" error={errors.status?.message}>
          <Select id="status" {...register('status')}>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </Select>
        </Field>
      </div>

      {errors.root && (
        <p className="field__error" role="alert">
          {errors.root.message}
        </p>
      )}

      {/*
        isSubmitting comes free from RHF. Without it, an impatient user on
        slow wi-fi double-clicks and creates the task twice.
      */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Add task'}
      </Button>
    </form>
  );
}
