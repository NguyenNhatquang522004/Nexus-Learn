import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  inputClassName = '',
  onChange,
  onBlur,
  onFocus,
  ...props
}) => {
  const inputClasses = clsx(
    'input',
    error && 'input-error',
    icon && iconPosition === 'left' && 'pl-10',
    icon && iconPosition === 'right' && 'pr-10',
    inputClassName
  );

  const containerClasses = clsx('relative', className);

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={name} className="label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-neutral-400">{icon}</span>
          </div>
        )}

        <motion.input
          type={type}
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-neutral-400">{icon}</span>
          </div>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-error-500"
        >
          {error}
        </motion.p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
