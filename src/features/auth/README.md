# auth feature

All authentication and user-session related code in one place.

## Structure

```
auth/
├── ui/                         # Auth-related UI components
│   ├── GoogleOAuthCompleteModal.js  - Post-Google-login completion modal
│   ├── ProtectedRoute.js            - Route guard component
│   └── EmailVerificationBanner.js   - Banner prompting email verification
└── routes/                     # Auth pages (React Router routes)
    ├── PlayerLogin.js           - /player/login
    ├── PlayerRegister.js        - /player/register
    ├── HostLogin.js             - /host/login
    ├── HostRegister.js          - /host/register
    ├── VerifyEmail.js           - /verify-email/:token
    ├── ForgotPassword.js        - /forgot-password
    ├── ResetPassword.js         - /reset-password/:token
    ├── CheckEmail.js            - /check-email
    ├── HostVerificationPending.js   - Pending host approval page
    └── AdminRedirect.js             - Admin redirect helper
```

## Import paths

From within `ui/` or `routes/`:
- Auth context: `../../../context/AuthContext`
- API: `../../../utils/api`
- Intra-feature: `../ui/GoogleOAuthCompleteModal` (from routes)
