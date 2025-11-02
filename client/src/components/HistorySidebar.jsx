/**
 * @fileoverview Painel lateral para exibir o histórico de documentações geradas
 * @component HistorySidebar
 * @param {Object} props
 * @param {Array} props.history - Array de itens de histórico
 * @param {Function} props.onLoadItem - Função de callback para carregar um item
 * @returns {JSX.Element}
 */
export function HistorySidebar({ history, onLoadItem }) {
  if (history.length === 0) {
    return (
      <aside className="p-4 bg-gray-50 rounded-lg shadow-inner">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">History</h3>
        <p className="text-sm text-gray-600">No history yet. Generate documentation to save it here.</p>
      </aside>
    );
  }

  return (
    <aside className="p-4 bg-gray-50 rounded-lg shadow-inner lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto custom-scrollbar">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">History</h3>
      <ul className="space-y-3">
        {history.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onLoadItem(item)}
              className="w-full text-left p-3 bg-white rounded-md shadow-sm hover:bg-primary-50 hover:shadow-md transition-all focus:outline-none focus:ring-3 focus:ring-primary-500"
            >
              <p className="font-medium text-primary-700 truncate" title={item.title}>{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.timestamp}</p>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
