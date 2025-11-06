/**
 * @fileoverview Platform selector component for choosing between Notion and Confluence
 * @component PlatformSelector
 */

/**
 * @function PlatformSelector
 * @description Radio button selector for documentation platform (Notion/Confluence)
 * @param {Object} props - Component props
 * @param {'notion'|'confluence'} props.selected - Currently selected platform
 * @param {Function} props.onChange - Callback when platform changes
 * @param {{notion: boolean, confluence: boolean}} props.availablePlatforms - Which platforms are configured
 * @returns {JSX.Element}
 * @example
 *   <PlatformSelector
 *     selected="notion"
 *     onChange={(platform) => console.log(platform)}
 *     availablePlatforms={{ notion: true, confluence: false }}
 *   />
 */
export function PlatformSelector({ selected, onChange, availablePlatforms }) {
  const bothAvailable =
    availablePlatforms.notion && availablePlatforms.confluence;

  if (!bothAvailable) {
    return null;
  }

  return (
    <div className="mb-6">
      <label className="mb-2 block text-base font-semibold text-slate-900">
        Send documentation to
      </label>
      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="platform"
            value="notion"
            checked={selected === 'notion'}
            onChange={(e) => onChange(e.target.value)}
            className="h-4 w-4 border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-sm text-slate-500 leading-relaxed">Notion</span>
        </label>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="platform"
            value="confluence"
            checked={selected === 'confluence'}
            onChange={(e) => onChange(e.target.value)}
            className="h-4 w-4 border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-sm text-slate-500 leading-relaxed">
            Confluence
          </span>
        </label>
      </div>
    </div>
  );
}
