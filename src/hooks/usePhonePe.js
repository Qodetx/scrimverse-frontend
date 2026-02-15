import { useState, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Custom hook for PhonePe payment integration
 * Handles payment initiation, status checking, and iframe callbacks
 */
const usePhonePe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  /**
   * Initiate a payment transaction
   * @param {Object} params - Payment parameters
   * @param {string} params.payment_type - 'tournament_plan', 'scrim_plan', or 'entry_fee'
   * @param {number} params.amount - Amount in INR
   * @param {number} params.tournament_id - Tournament/Scrim ID (required for plan payments)
   * @param {number} params.registration_id - Registration ID (required for entry fee)
   * @param {Function} onSuccess - Callback on successful payment
   * @param {Function} onFailure - Callback on failed payment
   * @param {Function} onCancel - Callback on user cancel
   */
  const initiatePayment = useCallback(async (params, onSuccess, onFailure, onCancel) => {
    setLoading(true);
    setError(null);

    try {
      const tokens = localStorage.getItem('tokens');
      if (!tokens) {
        throw new Error('Please login to continue');
      }
      const { access: accessToken } = JSON.parse(tokens);

      // Prepare request body
      const requestBody = {
        payment_type: params.payment_type,
        amount: params.amount,
        redirect_url: `${window.location.origin}/payment/callback`,
      };

      // Add tournament_id or registration_id based on payment type
      if (params.payment_type === 'tournament_plan' || params.payment_type === 'scrim_plan') {
        if (!params.tournament_id) {
          throw new Error('Tournament/Scrim ID is required');
        }
        requestBody.tournament_id = params.tournament_id;
      } else if (params.payment_type === 'entry_fee') {
        if (!params.registration_id) {
          throw new Error('Registration ID is required');
        }
        requestBody.registration_id = params.registration_id;
      }

      // Call backend API to initiate payment
      const response = await fetch(`${API_BASE_URL}/payments/initiate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      if (!data.success) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      // Store payment data
      setPaymentData({
        merchant_order_id: data.merchant_order_id,
        phonepe_order_id: data.phonepe_order_id,
        amount: params.amount,
        payment_type: params.payment_type,
      });

      // Store merchant order ID in localStorage for callback page
      localStorage.setItem('pending_payment_order_id', data.merchant_order_id);

      // Check if PhonePeCheckout is available
      if (!window.PhonePeCheckout) {
        throw new Error('PhonePe checkout not loaded. Please refresh the page.');
      }

      // Open PhonePe checkout in iframe mode
      window.PhonePeCheckout.transact({
        tokenUrl: data.redirect_url,
        callback: async (response) => {
          if (response === 'USER_CANCEL') {
            setLoading(false);
            if (onCancel) {
              onCancel();
            }
          } else if (response === 'CONCLUDED') {
            // Payment concluded, check status
            try {
              const statusData = await checkPaymentStatus(data.merchant_order_id);

              if (statusData.status === 'completed') {
                if (onSuccess) {
                  onSuccess(statusData);
                }
              } else if (statusData.status === 'failed') {
                if (onFailure) {
                  onFailure(statusData);
                }
              } else {
                // Still pending
                if (onSuccess) {
                  onSuccess(statusData);
                }
              }
            } catch (err) {
              setError(err.message);
              if (onFailure) {
                onFailure({ error: err.message });
              }
            } finally {
              setLoading(false);
            }
          }
        },
        type: 'IFRAME',
      });
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.message);
      setLoading(false);
      if (onFailure) {
        onFailure({ error: err.message });
      }
    }
  }, []);

  /**
   * Check payment status
   * @param {string} merchantOrderId - Merchant order ID
   * @returns {Promise<Object>} Payment status data
   */
  const checkPaymentStatus = useCallback(async (merchantOrderId) => {
    try {
      const tokens = localStorage.getItem('tokens');
      if (!tokens) {
        throw new Error('Please login to continue');
      }
      const { access: accessToken } = JSON.parse(tokens);

      const response = await fetch(`${API_BASE_URL}/payments/status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          merchant_order_id: merchantOrderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check payment status');
      }

      if (!data.success) {
        throw new Error(data.error || 'Status check failed');
      }

      return data;
    } catch (err) {
      console.error('Status check error:', err);
      throw err;
    }
  }, []);

  /**
   * Get payment history for current user
   * @returns {Promise<Array>} List of payments
   */
  const getPaymentHistory = useCallback(async () => {
    try {
      const tokens = localStorage.getItem('tokens');
      if (!tokens) {
        throw new Error('Please login to continue');
      }
      const { access: accessToken } = JSON.parse(tokens);

      const response = await fetch(`${API_BASE_URL}/payments/list/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      return data;
    } catch (err) {
      console.error('Payment history error:', err);
      throw err;
    }
  }, []);

  /**
   * Get pending/failed payments for current user
   * @returns {Promise<Array>} List of pending payments
   */
  const getPendingPayments = useCallback(async () => {
    try {
      const tokens = localStorage.getItem('tokens');
      if (!tokens) {
        throw new Error('Please login to continue');
      }
      const { access: accessToken } = JSON.parse(tokens);

      const response = await fetch(`${API_BASE_URL}/payments/pending/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch pending payments');
      }

      return data;
    } catch (err) {
      console.error('Pending payments error:', err);
      throw err;
    }
  }, []);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    paymentData,
    initiatePayment,
    checkPaymentStatus,
    getPaymentHistory,
    getPendingPayments,
    clearError,
  };
};

export default usePhonePe;
