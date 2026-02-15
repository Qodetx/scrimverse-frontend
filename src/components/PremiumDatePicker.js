import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './PremiumDatePicker.css';

const PremiumDatePicker = ({ value, onChange, label, name, minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      const localDate = new Date(y, m - 1, d);
      setSelectedDate(localDate);
      setCurrentMonth(localDate);
    } else {
      setSelectedDate(null);
      setCurrentMonth(new Date());
    }
  }, [value, isOpen]);

  const toggleModal = () => setIsOpen(!isOpen);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const newDate = new Date(year, month, day);

    let minComp = new Date();
    if (minDate) {
      const [my, mm, md] = minDate.split('-').map(Number);
      minComp = new Date(my, mm - 1, md);
    }
    minComp.setHours(0, 0, 0, 0);

    if (newDate < minComp) return; // Block past dates

    // Format as YYYY-MM-DD using local time to avoid timezone shifts
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;

    onChange({ target: { name, value: dateString } });
    setIsOpen(false);
  };

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const days = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const offset = firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const modalContent = (
    <div className="date-modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="date-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="date-header">
          <div className="date-year-display">{currentMonth.getFullYear()}</div>
          <div className="date-selected-display">
            {selectedDate
              ? selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Select Date'}
          </div>
        </div>

        <div className="calendar-controls">
          <button onClick={handlePrevMonth} className="cal-ctrl-btn">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M15 19l-7-7 7-7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="current-month-label">{months[currentMonth.getMonth()]}</div>
          <button onClick={handleNextMonth} className="cal-ctrl-btn">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M9 5l7 7-7 7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="calendar-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="calendar-day-label">
              {d}
            </div>
          ))}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty"></div>
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected =
              selectedDate &&
              selectedDate.getDate() === day &&
              selectedDate.getMonth() === currentMonth.getMonth() &&
              selectedDate.getFullYear() === currentMonth.getFullYear();
            const isToday = new Date().toDateString() === dateObj.toDateString();

            let minComp = new Date();
            if (minDate) {
              const [my, mm, md] = minDate.split('-').map(Number);
              minComp = new Date(my, mm - 1, md);
            }
            minComp.setHours(0, 0, 0, 0);
            const isPast = dateObj < minComp;

            return (
              <div
                key={day}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isPast ? 'disabled' : ''}`}
                onClick={() => !isPast && handleDateClick(day)}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div className="date-actions">
          <button className="date-btn-cancel" onClick={() => setIsOpen(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="premium-date-picker-container">
      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase ml-1">{label}</label>
      <div className="relative group" onClick={toggleModal}>
        <input
          type="text"
          readOnly
          value={value ? new Date(value).toLocaleDateString() : ''}
          placeholder="Select Date"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-cyan/50 cursor-pointer group-hover:bg-white/10 transition-all font-mono"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-accent-cyan transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
      {isOpen && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
};

export default PremiumDatePicker;
