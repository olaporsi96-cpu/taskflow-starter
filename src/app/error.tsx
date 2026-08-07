'use client';

import { ErrorPanel } from '@/components/ui';

/**
 * TODO 8 — a file called error.tsx turns the route into an error boundary.
 *
 * It MUST be a client component: error boundaries need lifecycle behaviour
 * that only exists in the browser. Everybody forgets this once — now you have
 * forgotten it here instead of in production.
 *
 * `reset` re-renders the route and gives it another go.
 */
export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel title="Could not load this project" message={error.message} onRetry={reset} />;
}
