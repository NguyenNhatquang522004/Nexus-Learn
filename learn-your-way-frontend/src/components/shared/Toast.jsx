import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../../store/slices/uiSlice';

const Toast = ({ id, message, type = 'info', duration = 3000 }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        dispatch(removeToast(id));
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, dispatch]);

  const icons = {
    success: <FiCheck className="w-5 h-5" />,
    error: <FiAlertCircle className="w-5 h-5" />,
    warning: <FiAlertTriangle className="w-5 h-5" />,
    info: <FiInfo className="w-5 h-5" />
  };

  const bgColors = {
    success: 'bg-success-50 border-success-500',
    error: 'bg-error-50 border-error-500',
    warning: 'bg-warning-50 border-warning-500',
    info: 'bg-primary-50 border-primary-500'
  };

  const textColors = {
    success: 'text-success-700',
    error: 'text-error-700',
    warning: 'text-warning-700',
    info: 'text-primary-700'
  };

  const iconColors = {
    success: 'text-success-500',
    error: 'text-error-500',
    warning: 'text-warning-500',
    info: 'text-primary-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 200, scale: 0.5 }}
      className={`flex items-center gap-3 p-4 rounded-lg border-l-4 shadow-medium ${bgColors[type]} ${textColors[type]} min-w-[320px] max-w-md`}
    >
      <div className={iconColors[type]}>
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => dispatch(removeToast(id))}
        className={`${textColors[type]} hover:opacity-70 transition-opacity`}
      >
        <FiX className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

const ToastContainer = () => {
  const toasts = useSelector((state) => state.ui.toasts);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
