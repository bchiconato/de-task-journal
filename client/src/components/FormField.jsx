import { cloneElement } from 'react';
import { CharacterCounter } from './CharacterCounter';

/**
 * @component FormField
 * @description Reusable form field wrapper with accessibility features and character counting
 * @param {Object} props
 * @param {string} props.label - Field label text
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.helperText - Helper text below label
 * @param {string} props.error - Error message
 * @param {React.ReactNode} props.children - Input element
 * @param {string} props.id - Unique field ID
 * @param {number} props.characterCount - Current character count (for counter)
 * @param {number} props.maxLength - Maximum length (for counter)
 * @returns {JSX.Element} Form field wrapper with label, helper text, error handling
 */
export function FormField({
  label,
  required = false,
  helperText,
  error,
  children,
  id,
  characterCount,
  maxLength,
}) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const counterId = `${id}-counter`;

  const describedBy = [
    helperText && helperId,
    error && errorId,
    characterCount !== undefined && counterId,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-900">
          {label}
          {required ? (
            <span className="ml-1 text-error-600" aria-label="required">
              *
            </span>
          ) : (
            <span className="ml-2 text-xs font-normal text-gray-500">(Optional)</span>
          )}
        </label>

        {characterCount !== undefined && (
          <CharacterCounter current={characterCount} max={maxLength} id={counterId} />
        )}
      </div>

      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-600">
          {helperText}
        </p>
      )}

      <div className={error ? 'form-field-error' : ''}>
        {children && typeof children === 'object' && children.type
          ? cloneElement(children, {
              id,
              'aria-required': required,
              'aria-invalid': !!error,
              'aria-describedby': describedBy || undefined,
            })
          : children}
      </div>

      {error && (
        <div
          id={errorId}
          className="flex items-start gap-1.5 text-sm text-error-600"
          role="alert"
        >
          <span aria-hidden="true" className="font-bold">
            ⚠
          </span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
