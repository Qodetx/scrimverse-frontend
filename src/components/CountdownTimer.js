import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate, label }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return null;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <span className="text-white font-black">Started</span>;
  }

  const valueStyle = 'text-lg md:text-xl font-black text-white leading-none';
  const labelStyle = 'text-[10px] text-gray-400 uppercase tracking-wider font-black mt-1';
  const boxStyle =
    'flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg h-14 w-12 shadow-sm';

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-accent-blue tracking-wide uppercase">
        {label}
      </span>
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <div className={boxStyle}>
            <span className={valueStyle}>{timeLeft.days}</span>
            <span className={labelStyle}>Day</span>
          </div>
        )}
        <div className={boxStyle}>
          <span className={valueStyle}>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className={labelStyle}>Hr</span>
        </div>
        <div className={boxStyle}>
          <span className={valueStyle}>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className={labelStyle}>Min</span>
        </div>
        <div className={boxStyle}>
          <span className={valueStyle}>{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className={labelStyle}>Sec</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
