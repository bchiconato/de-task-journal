import { FormField } from './FormField';

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
      <FormField
        label="Overview & Components"
        required={true}
        helperText="Describe the system/component purpose and its main building blocks"
        error={touched.overview && errors.overview}
        id="overview"
        characterCount={formData.overview?.length || 0}
        maxLength={10000}
      >
        <textarea
          ref={overviewRef}
          name="overview"
          value={formData.overview || ''}
          onChange={(e) => onFieldChange('overview', e.target.value)}
          onBlur={() => onFieldBlur('overview')}
          placeholder="Example: This is a real-time data pipeline that ingests customer events from multiple sources. Key components include an API Gateway for ingestion, a Kafka cluster for streaming, and a PostgreSQL database for storage..."
          className={`
            w-full px-4 py-3 border rounded-lg
            focus:outline-none focus:ring-3 focus:ring-primary-500 focus:border-primary-500
            min-h-[160px] lg:min-h-[200px] xl:min-h-[240px]
            max-h-[400px] lg:max-h-[480px] xl:max-h-[560px]
            resize-y overflow-y-auto
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${touched.overview && errors.overview ? 'border-error-600' : 'border-gray-300'}
          `}
          disabled={isLoading}
          aria-describedby="overview-helper overview-counter"
        />
      </FormField>

      <FormField
        label="Data Flow & Technology Stack"
        required={true}
        helperText="How does data move through the system? What technologies are used?"
        error={touched.dataflow && errors.dataflow}
        id="dataflow"
        characterCount={formData.dataflow?.length || 0}
        maxLength={10000}
      >
        <textarea
          ref={dataflowRef}
          name="dataflow"
          value={formData.dataflow || ''}
          onChange={(e) => onFieldChange('dataflow', e.target.value)}
          onBlur={() => onFieldBlur('dataflow')}
          placeholder="Example: Data flows from mobile apps → API Gateway → Kafka (event streaming) → Flink (processing) → PostgreSQL (storage). Stack: Python 3.11, FastAPI, Kafka 3.0, Apache Flink, PostgreSQL 14, Docker..."
          className={`
            w-full px-4 py-3 border rounded-lg
            focus:outline-none focus:ring-3 focus:ring-primary-500 focus:border-primary-500
            min-h-[160px] lg:min-h-[200px] xl:min-h-[240px]
            max-h-[400px] lg:max-h-[480px] xl:max-h-[560px]
            resize-y overflow-y-auto
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${touched.dataflow && errors.dataflow ? 'border-error-600' : 'border-gray-300'}
          `}
          disabled={isLoading}
          aria-describedby="dataflow-helper dataflow-counter"
        />
      </FormField>

      <FormField
        label="Key Design Decisions & Trade-offs"
        required={true}
        helperText="Why did you choose specific technologies or patterns? What are the trade-offs?"
        error={touched.decisions && errors.decisions}
        id="decisions"
        characterCount={formData.decisions?.length || 0}
        maxLength={10000}
      >
        <textarea
          ref={decisionsRef}
          name="decisions"
          value={formData.decisions || ''}
          onChange={(e) => onFieldChange('decisions', e.target.value)}
          onBlur={() => onFieldBlur('decisions')}
          placeholder="Example: Chose Kafka over RabbitMQ for better scalability despite operational complexity. Trade-off: eventual consistency means users may see stale data for up to 5 seconds. Risk: no disaster recovery beyond daily backups..."
          className={`
            w-full px-4 py-3 border rounded-lg
            focus:outline-none focus:ring-3 focus:ring-primary-500 focus:border-primary-500
            min-h-[160px] lg:min-h-[200px] xl:min-h-[240px]
            max-h-[400px] lg:max-h-[480px] xl:max-h-[560px]
            resize-y overflow-y-auto
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${touched.decisions && errors.decisions ? 'border-error-600' : 'border-gray-300'}
          `}
          disabled={isLoading}
          aria-describedby="decisions-helper decisions-counter"
        />
      </FormField>
    </>
  );
}
