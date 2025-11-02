/**
 * @fileoverview Architecture documentation input fields
 * @component ArchitectureFields
 * @description Three text areas for architecture documentation: overview, dataflow, decisions
 * @example
 *   <ArchitectureFields
 *     formData={formData}
 *     errors={errors}
 *     touched={touched}
 *     onFieldChange={handleChange}
 *     onFieldBlur={handleBlur}
 *     isLoading={false}
 *     refs={{ overviewRef, dataflowRef, decisionsRef }}
 *   />
 * @param {Object} props
 * @param {Object} props.formData - Form data with overview, dataflow, decisions
 * @param {Object} props.errors - Validation errors
 * @param {Object} props.touched - Touched field tracking
 * @param {Function} props.onFieldChange - Field change handler
 * @param {Function} props.onFieldBlur - Field blur handler
 * @param {boolean} props.isLoading - Loading state
 * @param {Object} props.refs - Refs for focus management
 * @returns {JSX.Element}
 */
export function ArchitectureFields({
  formData,
  errors,
  touched,
  onFieldChange,
  onFieldBlur,
  isLoading,
  refs,
}) {
  const { overviewRef, dataflowRef, decisionsRef } = refs;

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Overview & Components</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Describe the system/component purpose and its main building blocks
            </p>
          </div>

          <div>
            <label htmlFor="overview" className="sr-only">
              Overview and Components
            </label>
            <textarea
              ref={overviewRef}
              id="overview"
              name="overview"
              value={formData.overview || ''}
              onChange={(e) => onFieldChange('overview', e.target.value)}
              onBlur={() => onFieldBlur('overview')}
              placeholder="Example: This is a real-time data pipeline that ingests customer events from multiple sources. Key components include an API Gateway for ingestion, a Kafka cluster for streaming, and a PostgreSQL database for storage..."
              rows={8}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50 resize-none transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              {touched.overview && errors.overview ? (
                <p className="text-sm text-red-600 leading-relaxed">{errors.overview}</p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed">Required field</p>
              )}
              <span className="text-xs text-slate-400">
                {formData.overview?.length || 0} / 10,000
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Data Flow & Technology Stack</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              How does data move through the system? What technologies are used?
            </p>
          </div>

          <div>
            <label htmlFor="dataflow" className="sr-only">
              Data Flow and Technology Stack
            </label>
            <textarea
              ref={dataflowRef}
              id="dataflow"
              name="dataflow"
              value={formData.dataflow || ''}
              onChange={(e) => onFieldChange('dataflow', e.target.value)}
              onBlur={() => onFieldBlur('dataflow')}
              placeholder="Example: Data flows from mobile apps → API Gateway → Kafka (event streaming) → Flink (processing) → PostgreSQL (storage). Stack: Python 3.11, FastAPI, Kafka 3.0, Apache Flink, PostgreSQL 14, Docker..."
              rows={8}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50 resize-none transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              {touched.dataflow && errors.dataflow ? (
                <p className="text-sm text-red-600 leading-relaxed">{errors.dataflow}</p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed">Required field</p>
              )}
              <span className="text-xs text-slate-400">
                {formData.dataflow?.length || 0} / 10,000
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Key Design Decisions & Trade-offs</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Why did you choose specific technologies or patterns? What are the trade-offs?
            </p>
          </div>

          <div>
            <label htmlFor="decisions" className="sr-only">
              Key Design Decisions and Trade-offs
            </label>
            <textarea
              ref={decisionsRef}
              id="decisions"
              name="decisions"
              value={formData.decisions || ''}
              onChange={(e) => onFieldChange('decisions', e.target.value)}
              onBlur={() => onFieldBlur('decisions')}
              placeholder="Example: Chose Kafka over RabbitMQ for better scalability despite operational complexity. Trade-off: eventual consistency means users may see stale data for up to 5 seconds. Risk: no disaster recovery beyond daily backups..."
              rows={8}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#003B44] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50 resize-none transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              {touched.decisions && errors.decisions ? (
                <p className="text-sm text-red-600 leading-relaxed">{errors.decisions}</p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed">Required field</p>
              )}
              <span className="text-xs text-slate-400">
                {formData.decisions?.length || 0} / 10,000
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
