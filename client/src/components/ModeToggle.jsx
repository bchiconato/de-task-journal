import { useCallback, useMemo, useRef } from 'react';

/**
 * @fileoverview Accessible two-tab toggle for switching between task and architecture modes
 * @component ModeToggle
 * @example
 *   <ModeToggle mode="task" onChange={(value) => setMode(value)} />
 * @param {Object} props
 * @param {'task'|'architecture'} props.mode - Currently selected documentation mode
 * @param {(mode: 'task'|'architecture') => void} props.onChange - Callback fired when the mode changes
 * @returns {JSX.Element}
 */
export function ModeToggle({ mode, onChange }) {
  const tabOrder = useMemo(() => ['task', 'architecture'], []);
  const taskRef = useRef(null);
  const architectureRef = useRef(null);

  const tabIds = {
    task: 'mode-toggle-tab-task',
    architecture: 'mode-toggle-tab-architecture',
  };

  const focusTab = useCallback((targetMode) => {
    if (targetMode === 'task') {
      taskRef.current?.focus();
    } else {
      architectureRef.current?.focus();
    }
  }, []);

  const selectMode = useCallback(
    (nextMode) => {
      if (mode !== nextMode) {
        onChange(nextMode);
      }
      focusTab(nextMode);
    },
    [focusTab, mode, onChange],
  );

  const handleKeyDown = useCallback(
    (event, currentMode) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const currentIndex = tabOrder.indexOf(mode);
        const offset = event.key === 'ArrowLeft' ? -1 : 1;
        const nextIndex = (currentIndex + tabOrder.length + offset) % tabOrder.length;
        const nextMode = tabOrder[nextIndex];
        selectMode(nextMode);
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        selectMode(tabOrder[0]);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        selectMode(tabOrder[tabOrder.length - 1]);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectMode(currentMode);
      }
    },
    [mode, selectMode, tabOrder],
  );

  const buildButtonProps = (targetMode) => ({
    id: tabIds[targetMode],
    ref: targetMode === 'task' ? taskRef : architectureRef,
    role: 'tab',
    tabIndex: mode === targetMode ? 0 : -1,
    'aria-controls': 'mode-toggle-panel',
    'aria-selected': mode === targetMode,
    onClick: () => selectMode(targetMode),
    onKeyDown: (event) => handleKeyDown(event, targetMode),
    className: `h-9 px-3 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60E7A9]/50 ${
      mode === targetMode
        ? 'bg-[#011D21] text-white'
        : 'text-white/70 hover:text-white hover:bg-[#004850]'
    }`,
  });

  return (
    <div
      role="tablist"
      aria-label="Documentation mode"
      className="inline-flex items-center gap-1"
    >
      <button type="button" {...buildButtonProps('task')}>
        Task
      </button>
      <button type="button" {...buildButtonProps('architecture')}>
        Architecture
      </button>
    </div>
  );
}
