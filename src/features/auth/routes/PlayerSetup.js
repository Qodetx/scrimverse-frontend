import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { authAPI } from '../../../utils/api';

const PlayerSetup = () => {
  const { fetchUserData } = useContext(AuthContext);
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const startCountdown = () => {
    setCountdown(600);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    setError('');
    if (!phoneNumber.trim() || phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      await authAPI.sendOTP('phone_change', phoneNumber);
      setOtpSent(true);
      setOtp('');
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      await authAPI.updatePhone(phoneNumber, otp);
      await fetchUserData();
      navigate('/player/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = () => {
    const m = Math.floor(countdown / 60);
    const s = String(countdown % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Verify Your Phone</h1>
          <p className="text-sm text-gray-400">Add your phone number to access your dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium mb-5">
            {error}
          </div>
        )}

        {!otpSent ? (
          /* Phone number entry */
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit number (e.g. 9876543210)"
                  maxLength="10"
                  className="block w-full pl-12 pr-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <p className="text-xs text-gray-500">Enter 10 digits without country code</p>
            </div>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading || phoneNumber.length !== 10}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>
        ) : (
          /* OTP entry */
          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center">
              OTP sent to <span className="text-white font-medium">{phoneNumber}</span>.{' '}
              <button
                type="button"
                className="text-primary hover:underline text-sm"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
              >
                Change number
              </button>
            </p>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400">Enter OTP</label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                maxLength="6"
                className="block w-full px-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-center text-xl tracking-widest"
              />
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <div className="text-center text-sm text-gray-500">
              {countdown > 0 ? (
                `Resend OTP in ${formatCountdown()}`
              ) : (
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSetup;
