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
    { id: 'task', label: 'Task Documenter', description: 'Document technical tasks and implementations' },
    { id: 'architecture', label: 'Architecture Documenter', description: 'Document system architecture and design' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
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
                flex-1 px-6 py-3 rounded-lg font-medium transition-all
                focus:outline-none focus:ring-3 focus:ring-primary-500
                ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:bg-gray-200'
                }
              `}
            >
              <div className="text-left">
                <div className="font-semibold">{m.label}</div>
                <div
                  className={`text-xs mt-1 ${
                    isActive ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  {m.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
