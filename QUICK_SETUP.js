// Quick Setup Guide for Email Verification Frontend

/*
 * STEP 1: Add Route to App.js
 * =============================
 */

// In src/App.js, add this import:
import VerifyEmail from './pages/VerifyEmail';

// Then add this route:
<Route path="/verify-email/:token" element={<VerifyEmail />} />


/*
 * STEP 2: Add Banner to Player Dashboard
 * ========================================
 */

// In src/pages/PlayerDashboard.js (or wherever your player dashboard is)
import EmailVerificationBanner from '../components/EmailVerificationBanner';

// Inside your component, add this at the top of the return statement:
<EmailVerificationBanner user={user} />


/*
 * STEP 3: Add Banner to Host Dashboard
 * ======================================
 */

// In src/pages/HostDashboard.js (or wherever your host dashboard is)
import EmailVerificationBanner from '../components/EmailVerificationBanner';

// Inside your component, add this at the top of the return statement:
<EmailVerificationBanner user={user} />


/*
 * STEP 4: Ensure User Object Has is_email_verified
 * ==================================================
 */

// Make sure your user object (from AuthContext or state) includes:
{
    id: 1,
        email: "user@example.com",
            username: "username",
                is_email_verified: false, // ← This field is required
  // ... other fields
}


/*
 * STEP 5: (Optional) Add Auto-Refresh
 * ====================================
 */

// In your Dashboard component, add this useEffect to auto-refresh user data:
useEffect(() => {
    if (!user?.is_email_verified) {
        const interval = setInterval(async () => {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/accounts/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user.is_email_verified) {
                    // Update your user state here
                    setUser(data.user);
                    clearInterval(interval);
                }
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }
}, [user?.is_email_verified]);


/*
 * FILES CREATED:
 * ==============
 * ✅ src/components/EmailVerificationBanner.js
 * ✅ src/components/EmailVerificationBanner.css
 * ✅ src/pages/VerifyEmail.js
 * ✅ src/pages/VerifyEmail.css
 * ✅ FRONTEND_EMAIL_VERIFICATION.md (Full documentation)
 */


/*
 * TESTING:
 * ========
 * 1. Login with an unverified account
 * 2. Go to dashboard - you should see the banner
 * 3. Click "Send Verification Email"
 * 4. Check your email inbox
 * 5. Click the verification link
 * 6. Should see success page and auto-redirect
 */
