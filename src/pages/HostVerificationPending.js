import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import './HostVerificationPending.css';

const HostVerificationPending = () => {
  const { user, fetchUserData } = useContext(AuthContext);
  const navigate = useNavigate();

  // COMMENTED OUT - Aadhar upload functionality (may be needed in future)
  // const [uploading, setUploading] = useState(false);
  // const [error, setError] = useState('');
  // const [success, setSuccess] = useState('');
  // const [frontImage, setFrontImage] = useState(null);
  // const [backImage, setBackImage] = useState(null);
  // const [frontPreview, setFrontPreview] = useState(null);
  // const [backPreview, setBackPreview] = useState(null);

  useEffect(() => {
    // Check if user is approved, redirect to dashboard
    if (user?.profile?.verification_status === 'approved') {
      navigate('/host/dashboard');
    }
  }, [user, navigate]);

  // COMMENTED OUT - Aadhar upload functionality (may be needed in future)
  // const handleFileChange = (e, side) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   // Validate file size (5MB)
  //   const maxSize = 5 * 1024 * 1024;
  //   if (file.size > maxSize) {
  //     setError('File size must be less than 5MB');
  //     return;
  //   }

  //   // Validate file type
  //   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  //   if (!allowedTypes.includes(file.type)) {
  //     setError('Only JPG, JPEG, PNG, and WEBP images are allowed');
  //     return;
  //   }

  //   setError('');

  //   if (side === 'front') {
  //     setFrontImage(file);
  //     setFrontPreview(URL.createObjectURL(file));
  //   } else {
  //     setBackImage(file);
  //     setBackPreview(URL.createObjectURL(file));
  //   }
  // };

  // const handleUpload = async (e) => {
  //   e.preventDefault();
  //   setError('');
  //   setSuccess('');

  //   if (!frontImage || !backImage) {
  //     setError('Please upload both front and back images of your Aadhar card');
  //     return;
  //   }

  //   setUploading(true);

  //   try {
  //     const formData = new FormData();
  //     formData.append('aadhar_card_front', frontImage);
  //     formData.append('aadhar_card_back', backImage);

  //     const response = await authAPI.uploadAadhar(formData);
  //     setSuccess(response.data.message);

  //     // Refresh user data to get updated verification status
  //     await fetchUserData();
  //   } catch (err) {
  //     if (err.response && err.response.data) {
  //       setError(err.response.data.error || 'Upload failed. Please try again.');
  //     } else {
  //       setError('Something went wrong. Please try again.');
  //     }
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const verificationStatus = user?.profile?.verification_status;
  // COMMENTED OUT - Aadhar upload functionality (may be needed in future)
  // const hasUploadedAadhar = user?.profile?.aadhar_card_front && user?.profile?.aadhar_card_back;

  return (
    <div className="verification-pending-page">
      <div className="verification-container">
        <div className="verification-card">
          {/* Header */}
          <div className="verification-header">
            <div className="icon-wrapper">
              <svg
                className="verification-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1>Host Verification</h1>
            <p className="subtitle">We will get back to you soon</p>
          </div>

          {/* Status Display */}
          {verificationStatus === 'pending' && (
            <div className="status-box status-pending">
              <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3>Verification Pending</h3>
                <p>
                  Your account is under review. We'll notify you once the admin approves your
                  account. You'll be able to access the host dashboard after approval.
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="status-box status-rejected">
              <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3>Verification Rejected</h3>
                <p>
                  {user?.profile?.verification_notes ||
                    'Your verification was rejected. Please contact support for more information.'}
                </p>
              </div>
            </div>
          )}

          {/* COMMENTED OUT - Aadhar upload form (may be needed in future) */}
          {/* {(!hasUploadedAadhar || verificationStatus === 'rejected') && (
            <form onSubmit={handleUpload} className="upload-form">
              <div className="upload-instructions">
                <h3>Upload Your Aadhar Card</h3>
                <p>Please upload clear images of both sides of your Aadhar card</p>
                <ul className="requirements-list">
                  <li>✓ Maximum file size: 5MB per image</li>
                  <li>✓ Supported formats: JPG, JPEG, PNG, WEBP</li>
                  <li>✓ Images should be clear and readable</li>
                  <li>✓ All details must be visible</li>
                </ul>
              </div>

              {error && (
                <div className="alert alert-error">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {success}
                </div>
              )}

              <div className="upload-grid">
                <div className="upload-box">
                  <label htmlFor="front-upload" className="upload-label">
                    {frontPreview ? (
                      <div className="preview-container">
                        <img src={frontPreview} alt="Aadhar Front" className="preview-image" />
                        <div className="preview-overlay">
                          <span>Click to change</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span>Upload Front Side</span>
                        <small>JPG, PNG, WEBP (Max 5MB)</small>
                      </div>
                    )}
                  </label>
                  <input
                    id="front-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleFileChange(e, 'front')}
                    className="file-input"
                  />
                </div>

                <div className="upload-box">
                  <label htmlFor="back-upload" className="upload-label">
                    {backPreview ? (
                      <div className="preview-container">
                        <img src={backPreview} alt="Aadhar Back" className="preview-image" />
                        <div className="preview-overlay">
                          <span>Click to change</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span>Upload Back Side</span>
                        <small>JPG, PNG, WEBP (Max 5MB)</small>
                      </div>
                    )}
                  </label>
                  <input
                    id="back-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleFileChange(e, 'back')}
                    className="file-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !frontImage || !backImage}
                className="submit-btn"
              >
                {uploading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    Uploading...
                  </div>
                ) : (
                  'Submit for Verification'
                )}
              </button>
            </form>
          )} */}

          {/* Footer */}
          <div className="verification-footer">
            <p>
              Need help? Contact us at{' '}
              <a href="mailto:support@scrimverse.com">support@scrimverse.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostVerificationPending;
