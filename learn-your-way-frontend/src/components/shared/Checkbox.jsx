import { clsx } from 'clsx';

const Checkbox = ({
  label,
  name,
  checked,
  disabled = false,
  error,
  className = '',
  onChange,
  ...props
}) => {
  const checkboxClasses = clsx(
    'w-5 h-5 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 transition-colors cursor-pointer',
    disabled && 'opacity-50 cursor-not-allowed',
    error && 'border-error-500',
    className
  );

  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          disabled={disabled}
          className={checkboxClasses}
          onChange={onChange}
          {...props}
        />
      </div>
      {label && (
        <div className="ml-3">
          <label
            htmlFor={name}
            className={clsx(
              'text-sm font-medium text-neutral-700 cursor-pointer',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
          </label>
          {error && (
            <p className="mt-1 text-sm text-error-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkbox;
