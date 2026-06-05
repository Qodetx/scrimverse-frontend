import { useState, useCallback } from 'react';

/**
 * Hook for MSG91 OTP widget integration.
 * Uses window.sendOtp / window.verifyOtp exposed by the MSG91 widget script in index.html.
 *
 * Returns:
 *   sendOTP(phone)       - sends OTP to phone (10-digit, no country code)
 *   verifyOTP(otp)       - verifies OTP, resolves with access token on success
 *   retryOTP()           - resends OTP via SMS
 *   sending              - bool: OTP send in progress
 *   verifying            - bool: OTP verify in progress
 *   otpSent              - bool: OTP has been sent
 *   otpVerified          - bool: OTP verified successfully
 *   accessToken          - string: MSG91 access token after verification
 *   error                - string: last error message
 *   reset()              - reset all state
 */
const useMSG91OTP = () => {
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');

  const isWidgetReady = () => typeof window.sendOtp === 'function';

  const sendOTP = useCallback((phone) => {
    return new Promise((resolve, reject) => {
      setError('');
      if (!isWidgetReady()) {
        const msg = 'OTP service not loaded. Please refresh and try again.';
        setError(msg);
        reject(new Error(msg));
        return;
      }
      setSending(true);
      window.sendOtp(
        `91${phone}`,
        (data) => {
          setSending(false);
          setOtpSent(true);
          resolve(data);
        },
        (err) => {
          setSending(false);
          const msg = err?.message || 'Failed to send OTP. Please try again.';
          setError(msg);
          reject(new Error(msg));
        }
      );
    });
  }, []);

  const verifyOTP = useCallback((otp) => {
    return new Promise((resolve, reject) => {
      setError('');
      if (!isWidgetReady()) {
        const msg = 'OTP service not loaded. Please refresh and try again.';
        setError(msg);
        reject(new Error(msg));
        return;
      }
      setVerifying(true);
      window.verifyOtp(
        otp,
        (data) => {
          setVerifying(false);
          setOtpVerified(true);
          // MSG91 returns access token in data or data.message
          const token = data?.token || data?.message || data;
          setAccessToken(token);
          resolve(token);
        },
        (err) => {
          setVerifying(false);
          const msg = err?.message || 'Invalid OTP. Please try again.';
          setError(msg);
          reject(new Error(msg));
        }
      );
    });
  }, []);

  const retryOTP = useCallback(() => {
    return new Promise((resolve, reject) => {
      setError('');
      if (!window.retryOtp) {
        sendOTP.reject && reject(new Error('Retry not available'));
        return;
      }
      setSending(true);
      window.retryOtp(
        'SMS',
        (data) => {
          setSending(false);
          resolve(data);
        },
        (err) => {
          setSending(false);
          const msg = err?.message || 'Failed to resend OTP.';
          setError(msg);
          reject(new Error(msg));
        }
      );
    });
  }, []);

  const reset = useCallback(() => {
    setSending(false);
    setVerifying(false);
    setOtpSent(false);
    setOtpVerified(false);
    setAccessToken('');
    setError('');
  }, []);

  return {
    sendOTP,
    verifyOTP,
    retryOTP,
    sending,
    verifying,
    otpSent,
    otpVerified,
    accessToken,
    error,
    reset,
  };
};

export default useMSG91OTP;
