import React, { useEffect, useState } from 'react';
import './NewUserIndicator.css';

/**
 * NewUserIndicator — Small floating tooltip pointing to the Onboarding button.
 * Shows only when:
 * - User's last_login is null (first time after signup)
 * - User hasn't dismissed the indicator
 *
 * Displays a pulse dot + tooltip message near the Onboarding button.
 * Dismisses when user clicks outside or on the Onboarding button.
 */
const NewUserIndicator = ({ isNew, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isNew) {
      setIsVisible(true);
    }
  }, [isNew]);

  useEffect(() => {
    if (!isVisible) return;

    // Dismiss on click anywhere
    const handleClick = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isVisible, onDismiss]);

  if (!isNew || !isVisible) return null;

  return (
    <div className="new-user-indicator" onClick={(e) => e.stopPropagation()}>
      {/* Pulse dot */}
      <div className="indicator-pulse"></div>

      {/* Tooltip */}
      <div className="indicator-tooltip">
        <p className="indicator-text">Click here to explore ScrimVerse</p>
        <div className="indicator-arrow"></div>
      </div>
    </div>
  );
};

export default NewUserIndicator;
