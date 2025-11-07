import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  hover = false,
  clickable = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  onClick,
  ...props
}) => {
  const cardClasses = clsx(
    'card',
    hover && 'cursor-pointer hover:shadow-hard',
    clickable && 'cursor-pointer',
    className
  );

  const CardWrapper = clickable || hover ? motion.div : 'div';

  const motionProps = (clickable || hover) ? {
    whileHover: { y: -4 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <CardWrapper
      className={cardClasses}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {(title || subtitle) && (
        <div className={clsx('p-6 border-b border-neutral-200', headerClassName)}>
          {title && (
            <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
          )}
        </div>
      )}

      <div className={clsx('p-6', bodyClassName)}>
        {children}
      </div>

      {footer && (
        <div className={clsx('px-6 py-4 bg-neutral-50 border-t border-neutral-200', footerClassName)}>
          {footer}
        </div>
      )}
    </CardWrapper>
  );
};

export default Card;
