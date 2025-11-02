/**
 * @fileoverview Tab-based mode switcher between Task and Architecture documentation
 * @component ModeToggle
 * @example
 *   <ModeToggle mode="task" onModeChange={setMode} />
 * @param {Object} props
 * @param {('task'|'architecture')} props.mode - Current active mode
 * @param {Function} props.onModeChange - Handler called when mode changes
 * @returns {JSX.Element}
 */
export function ModeToggle({ mode, onModeChange }) {
  const modes = [
    {
      id: 'task',
      label: 'Task',
      icon: '📝',
      description: 'Document technical tasks and implementations'
    },
    {
      id: 'architecture',
      label: 'Architecture',
      icon: '🏗️',
      description: 'Document system architecture and design'
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Documentation Mode
      </h2>
      <div role="tablist" aria-label="Documentation mode selector" className="flex gap-2">
        {modes.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${m.id}-panel`}
              onClick={() => onModeChange(m.id)}
              className={`
                flex-1 px-4 py-3 rounded-lg font-medium transition-all text-center
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl" aria-hidden="true">{m.icon}</span>
                <span className="font-semibold text-sm">{m.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        {modes.find(m => m.id === mode)?.description}
      </p>
    </div>
  );
}
