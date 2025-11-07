import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label = '',
  animated = true,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500'
  };

  const containerClasses = clsx(
    'w-full bg-neutral-200 rounded-full overflow-hidden',
    sizeClasses[size],
    className
  );

  const BarComponent = animated ? motion.div : 'div';

  const barProps = animated ? {
    initial: { width: 0 },
    animate: { width: `${percentage}%` },
    transition: { duration: 0.5, ease: 'easeOut' }
  } : {
    style: { width: `${percentage}%` }
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-neutral-700">{label}</span>
          )}
          {showLabel && (
            <span className="text-sm font-medium text-neutral-700">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={containerClasses}>
        <BarComponent
          className={clsx(
            'h-full rounded-full transition-all',
            colorClasses[color]
          )}
          {...barProps}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
