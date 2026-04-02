import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Mail,
  Lock,
  ArrowLeft,
  Building,
  Phone,
  Globe,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { authAPI } from '../../../utils/api';
import GoogleOAuthCompleteModal from '../ui/GoogleOAuthCompleteModal';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

const TOTAL_STEPS = 3;

const HostRegister = () => {
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  // Step 2 fields
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3 fields
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [youtube, setYoutube] = useState('');
  const [website, setWebsite] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCredential, setGoogleCredential] = useState(null);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!email || !password || !password2) {
        setError('All fields are required.');
        return;
      }
      if (password !== password2) {
        setError("Passwords don't match.");
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
    }

    if (step === 2) {
      if (!orgName.trim()) {
        setError('Organization name is required.');
        return;
      }
      if (!phone.trim() || !/^\+\d{10,15}$/.test(phone)) {
        setError('Please enter phone with country code (e.g. +9198XXXXXX78).');
        return;
      }
    }

    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        email,
        password,
        password2,
        username: orgName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, ''),
        phone_number: phone,
        instagram: instagram.trim(),
        youtube: youtube.trim(),
        linkedin: linkedin.trim(),
        website: website.trim(),
      };

      const response = await authAPI.hostRegister(payload);

      if (response.data.verification_required) {
        navigate('/check-email', { state: { email: response.data.email } });
      } else {
        login(response.data.user, response.data.tokens);
        navigate('/host/verification-pending');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        const userFriendlyErrors = [];

        Object.entries(data).forEach(([field, messages]) => {
          const msgsArray = Array.isArray(messages)
            ? messages
            : typeof messages === 'string'
              ? [messages]
              : typeof messages === 'object'
                ? Object.values(messages).flat()
                : ['An unexpected error occurred.'];

          const label = field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

          msgsArray.forEach((msg) => {
            if (msg.includes('already exists')) {
              msg = `This ${label.toLowerCase()} is already in use. Try another one.`;
            } else if (msg.includes('too short')) {
              msg = 'Your password must be at least 8 characters long.';
            } else if (msg.includes("didn't match")) {
              msg = 'Passwords do not match.';
            }
            userFriendlyErrors.push(`⚠️ ${msg}`);
          });
        });

        setError(userFriendlyErrors.join('\n'));
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setGoogleCredential(credentialResponse);
    setShowGoogleModal(true);
  };

  const handleGoogleClick = () => {
    setError('');

    const { google } = window;
    if (!google) {
      setError('Google Sign-In not available. Please try again.');
      return;
    }

    google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleGoogleSuccess,
    });

    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setError('Google signup not available. Please use email and password.');
      }
    });
  };

  const handleGoogleComplete = (data) => {
    login(data.user, data.tokens);
    setShowGoogleModal(false);
    navigate('/host/verification-pending');
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="cyber-card border border-accent/30 p-8">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Create Host Account
              </h1>
              <p className="text-muted-foreground mt-2 text-center text-sm">
                Start hosting and organizing tournaments
              </p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      i + 1 < step
                        ? 'bg-accent text-white'
                        : i + 1 === step
                          ? 'bg-accent/20 border-2 border-accent text-accent'
                          : 'bg-secondary border border-border text-muted-foreground'
                    }`}
                  >
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  {i < TOTAL_STEPS - 1 && (
                    <div className={`w-8 h-0.5 ${i + 1 < step ? 'bg-accent' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {/* Error */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium whitespace-pre-wrap">
                  {error}
                </div>
              )}

              {/* ── STEP 1: Account Credentials ── */}
              {step === 1 && (
                <>
                  {/* Google Sign Up */}
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    className="w-full py-3 px-4 border border-border rounded-lg font-medium text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign up with Google
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                      or continue with email
                    </span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <form onSubmit={handleNextStep} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="host@example.com"
                          className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="password"
                          required
                          value={password2}
                          onChange={(e) => setPassword2(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="gaming-button w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 mt-2"
                    >
                      Continue
                    </button>
                  </form>
                </>
              )}

              {/* ── STEP 2: Contact & Identity ── */}
              {step === 2 && (
                <form onSubmit={handleNextStep} className="space-y-4">
                  <div className="mb-2">
                    <h2 className="text-base font-semibold text-foreground">
                      Contact &amp; Identity
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for verification and contact. Not shown publicly.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Organization / Management Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Your Esports Org"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+919876543210"
                        maxLength="15"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setStep(1);
                      }}
                      className="flex-1 py-3 px-4 border border-border rounded-lg font-medium text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 gaming-button py-3 px-4 rounded-lg font-bold text-white transition-all duration-300"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 3: Social Links (for verification) ── */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-2">
                    <h2 className="text-base font-semibold text-foreground">Social Links</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      For verification purposes only. These will not appear publicly. All optional.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Website <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yoursite.com"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Instagram</label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="https://instagram.com/yourhandle"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">LinkedIn</label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">YouTube</label>
                    <div className="relative">
                      <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={youtube}
                        onChange={(e) => setYoutube(e.target.value)}
                        placeholder="https://youtube.com/@yourchannel"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setStep(2);
                      }}
                      className="flex-1 py-3 px-4 border border-border rounded-lg font-medium text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 gaming-button py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Submitting...
                        </span>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Sign in link — shown on step 1 only */}
              {step === 1 && (
                <>
                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <Link
                        to="/host/login"
                        className="font-bold text-accent hover:text-accent/80 transition-colors"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>

                  <p className="text-center text-muted-foreground/50 text-xs">
                    By registering, you agree to Scrimverse's{' '}
                    <Link
                      to="/terms"
                      className="hover:text-muted-foreground transition-colors underline"
                    >
                      Terms &amp; Conditions
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <GoogleOAuthCompleteModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        googleData={googleCredential}
        userType="host"
        onSuccess={handleGoogleComplete}
      />
    </>
  );
};

export default HostRegister;
