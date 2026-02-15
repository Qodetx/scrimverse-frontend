import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './ClockTimePicker.css';

const ClockTimePicker = ({ value, onChange, label, name, baseDate, minTime, minDateForTime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempTime, setTempTime] = useState({ hour: '12', minute: '00', period: 'PM' });
  // const modalRef = useRef(null);

  // Initialize tempTime from value
  useEffect(() => {
    if (isOpen) {
      if (value) {
        const [h, m] = value.split(':');
        let hour = parseInt(h);
        const period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        setTempTime({
          hour: hour.toString().padStart(2, '0'),
          minute: m.padStart(2, '0'),
          period,
        });
      } else {
        // Default to a safe future time if none set
        const now = new Date();
        let h = now.getHours() + 1;
        const p = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        setTempTime({
          hour: h.toString().padStart(2, '0'),
          minute: '00',
          period: p,
        });
      }
    }
  }, [value, isOpen]);

  const isPastTime = (h, m, p) => {
    if (!baseDate) return false;

    const now = new Date();
    const [y, mm, d] = baseDate.split('-').map(Number);
    const selectedDate = new Date(y, mm - 1, d);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetH = parseInt(h);
    if (p === 'PM' && targetH < 12) targetH += 12;
    if (p === 'AM' && targetH === 12) targetH = 0;
    const targetM = parseInt(m);

    // Date is today, check time against now
    if (selectedDate.getTime() === today.getTime()) {
      if (targetH < now.getHours()) return true;
      if (targetH === now.getHours() && targetM <= now.getMinutes()) return true;
    }

    // Check against minTime if baseDate matches minDateForTime
    if (minDateForTime && baseDate === minDateForTime && minTime) {
      const [minH, minM] = minTime.split(':').map(Number);
      if (targetH < minH) return true;
      if (targetH === minH && targetM < minM) return true;
    }

    if (selectedDate < today) return true;

    return false;
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleSave = () => {
    if (isPastTime(tempTime.hour, tempTime.minute, tempTime.period)) {
      alert('Please select a future timing for your event.');
      return;
    }

    let hour = parseInt(tempTime.hour);
    if (tempTime.period === 'PM' && hour < 12) hour += 12;
    if (tempTime.period === 'AM' && hour === 12) hour = 0;

    const formattedTime = `${hour.toString().padStart(2, '0')}:${tempTime.minute}`;
    onChange({ target: { name, value: formattedTime } });
    setIsOpen(false);
  };

  const modalContent = (
    <div className="clock-modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="time-picker-premium-card" onClick={(e) => e.stopPropagation()}>
        <div className="tp-header">
          <h4 className="tp-title">Select Time</h4>
          <p className="tp-subtitle">Event Schedule (Local Time)</p>
        </div>

        <div className="tp-body">
          <div className="tp-column-container">
            {/* Hours Column */}
            <div className="tp-column">
              <span className="tp-col-label">Hrs</span>
              <div className="tp-scrollable">
                {hours.map((h) => (
                  <button
                    key={h}
                    className={`tp-item ${tempTime.hour === h ? 'active' : ''}`}
                    onClick={() => setTempTime((prev) => ({ ...prev, hour: h }))}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="tp-divider">:</div>

            {/* Minutes Column */}
            <div className="tp-column">
              <span className="tp-col-label">Min</span>
              <div className="tp-scrollable">
                {minutes.map((m) => (
                  <button
                    key={m}
                    className={`tp-item ${tempTime.minute === m ? 'active' : ''}`}
                    onClick={() => setTempTime((prev) => ({ ...prev, minute: m }))}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Period Column */}
            <div className="tp-column-period">
              <button
                className={`tp-period-btn ${tempTime.period === 'AM' ? 'active' : ''}`}
                onClick={() => setTempTime((prev) => ({ ...prev, period: 'AM' }))}
              >
                AM
              </button>
              <button
                className={`tp-period-btn ${tempTime.period === 'PM' ? 'active' : ''}`}
                onClick={() => setTempTime((prev) => ({ ...prev, period: 'PM' }))}
              >
                PM
              </button>
            </div>
          </div>

          {isPastTime(tempTime.hour, tempTime.minute, tempTime.period) && (
            <div className="tp-warning">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Cannot set time in the past</span>
            </div>
          )}
        </div>

        <div className="tp-footer">
          <button className="tp-btn-cancel" onClick={() => setIsOpen(false)}>
            Cancel
          </button>
          <button
            className={`tp-btn-save ${isPastTime(tempTime.hour, tempTime.minute, tempTime.period) ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={isPastTime(tempTime.hour, tempTime.minute, tempTime.period)}
          >
            Set Timing
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="premium-time-picker-container">
      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase ml-1">{label}</label>
      <div className="relative group" onClick={() => setIsOpen(true)}>
        <input
          type="text"
          readOnly
          value={
            value
              ? (() => {
                  const [h, m] = value.split(':');
                  let hour = parseInt(h);
                  const period = hour >= 12 ? 'PM' : 'AM';
                  hour = hour % 12 || 12;
                  return `${hour.toString().padStart(2, '0')}:${m} ${period}`;
                })()
              : ''
          }
          placeholder="Select Time"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-purple/50 cursor-pointer group-hover:bg-white/10 transition-all"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-accent-purple transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
      {isOpen && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
};

export default ClockTimePicker;
