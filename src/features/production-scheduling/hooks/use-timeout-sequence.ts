"use client";

import { useCallback, useEffect, useRef } from "react";

export interface TimeoutStep<TStep> {
  readonly afterMs: number;
  readonly value: TStep;
}

/**
 * Owns lifecycle-safe timeout orchestration for progressive UI simulations.
 *
 * Feature hooks describe a sequence; this hook owns timer allocation, cancellation,
 * replacement, and unmount cleanup. Keeping timer mechanics here prevents each
 * scenario flow from reimplementing mutable timer refs and effect cleanup.
 */
export function useTimeoutSequence<TStep>(
  onStep: (step: TStep) => void,
) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onStepRef = useRef(onStep);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  const cancel = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => cancel, [cancel]);

  const start = useCallback(
    (steps: readonly TimeoutStep<TStep>[]) => {
      cancel();
      timersRef.current = steps.map(({ afterMs, value }) =>
        setTimeout(() => onStepRef.current(value), afterMs),
      );
    },
    [cancel],
  );

  return { start, cancel } as const;
}
