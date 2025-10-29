/**
 * @fileoverview Example demonstrating React 19 useTransition for async pending state
 * @component UseTransitionExample
 * @description Optional reference implementation showing how to use transitions for
 * managing pending UI state without blocking user input. Not currently integrated
 * into the main application but provided as a pattern for future enhancements.
 * @example
 *   <UseTransitionExample run={async (value) => { await fetchData(value); }} />
 */
import { useState, useTransition } from 'react';

/**
 * @function UseTransitionExample
 * @param {object} props
 * @param {(value: string) => Promise<void>} props.run - Async function to execute
 * @returns {JSX.Element}
 */
export function UseTransitionExample({ run }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState('');

  function onSubmit() {
    startTransition(async () => {
      await run(value);
    });
  }

  return (
    <div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isPending}
        placeholder="Enter value"
        className="border rounded px-3 py-2"
      />
      <button
        disabled={isPending}
        onClick={onSubmit}
        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {isPending ? 'Working…' : 'Run'}
      </button>
    </div>
  );
}
