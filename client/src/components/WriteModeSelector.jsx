/**
 * @fileoverview Write mode selector component for Confluence write operations
 * @component WriteModeSelector
 */

/**
 * @component WriteModeSelector
 * @description Radio button group for selecting write mode (Append/Overwrite)
 * @param {Object} props
 * @param {('append'|'overwrite')} props.selected - Currently selected write mode
 * @param {Function} props.onChange - Callback when write mode changes
 * @returns {JSX.Element} Write mode selector with radio buttons
 * @example
 *   <WriteModeSelector selected="append" onChange={(mode) => setWriteMode(mode)} />
 */
export function WriteModeSelector({ selected = 'append', onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-slate-700">Write Mode</h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Choose how to insert documentation into the selected page
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">Write mode selection</legend>

        <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="radio"
            id="writeMode-append"
            name="writeMode"
            value="append"
            checked={selected === 'append'}
            onChange={(e) => onChange(e.target.value)}
            className="mt-0.5 h-4 w-4 text-[#003B44] border-slate-300 focus:ring-2 focus:ring-[#003B44]/50 focus:ring-offset-1"
          />
          <label htmlFor="writeMode-append" className="flex-1 cursor-pointer">
            <p className="text-sm font-medium text-slate-900">
              Append (Add to end)
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Keeps existing content and adds new documentation at the bottom of
              the page
            </p>
          </label>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="radio"
            id="writeMode-overwrite"
            name="writeMode"
            value="overwrite"
            checked={selected === 'overwrite'}
            onChange={(e) => onChange(e.target.value)}
            className="mt-0.5 h-4 w-4 text-[#003B44] border-slate-300 focus:ring-2 focus:ring-[#003B44]/50 focus:ring-offset-1"
          />
          <label
            htmlFor="writeMode-overwrite"
            className="flex-1 cursor-pointer"
          >
            <p className="text-sm font-medium text-slate-900">
              Overwrite (Replace all)
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Removes all existing content and replaces it with new
              documentation
            </p>
          </label>
        </div>
      </fieldset>
    </div>
  );
}
