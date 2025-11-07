import { clsx } from 'clsx';

const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  text = '',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-primary-500',
    secondary: 'border-secondary-500',
    white: 'border-white',
    neutral: 'border-neutral-500'
  };

  const spinnerClasses = clsx(
    'animate-spin rounded-full border-4 border-t-transparent',
    sizeClasses[size],
    colorClasses[color],
    className
  );

  const containerClasses = clsx(
    'flex flex-col items-center justify-center',
    fullScreen && 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50'
  );

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses} />
      {text && (
        <p className="mt-4 text-sm text-neutral-600">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
