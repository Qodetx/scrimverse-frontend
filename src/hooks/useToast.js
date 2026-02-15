import { useState } from 'react';

/**
 * Custom hook for managing toast notifications
 * @returns {Object} { toast, showToast, hideToast, ToastComponent }
 */
export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    hideToast,
  };
};

export default useToast;
