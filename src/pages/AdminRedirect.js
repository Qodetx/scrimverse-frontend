import React, { useEffect } from 'react';

const AdminRedirect = () => {
  useEffect(() => {
    // Try to compute backend base URL from REACT_APP_API_URL
    const apiUrl = process.env.REACT_APP_API_URL || '';
    let backend = apiUrl;
    try {
      // Remove trailing /api or /api/ if present
      backend = backend.replace(/\/api\/?$/, '');
    } catch (e) {
      // noop
    }

    // Fallback to same origin if REACT_APP_API_URL is not set
    if (!backend) backend = window.location.origin;

    // Redirect to Django admin
    const adminUrl = `${backend.replace(/\/$/, '')}/admin/`;
    window.location.href = adminUrl;
  }, []);

  return null;
};

export default AdminRedirect;
