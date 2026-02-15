import React, { useState, useRef, useEffect } from 'react';
import './PremiumDropdown.css';

const PremiumDropdown = ({
  value,
  onChange,
  options,
  label,
  name,
  placeholder = 'Select Option',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setIsOpen(false);
  };

  return (
    <div className="premium-dropdown-container" ref={dropdownRef}>
      {label && <label className="premium-dropdown-label">{label}</label>}
      <div
        className={`premium-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="trigger-content">
          {icon && <span className="trigger-icon">{icon}</span>}
          <span className={`trigger-text ${!value ? 'placeholder' : ''}`}>
            {value || placeholder}
          </span>
        </div>
        <div className="trigger-arrow">
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="premium-dropdown-menu">
          <div className="menu-scroll">
            {options.map((option) => (
              <div
                key={option}
                className={`menu-item ${value === option ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                <span className="item-text">{option}</span>
                {value === option && (
                  <span className="selected-check">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumDropdown;
