import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, XCircle, Mail } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

const HostVerificationPending = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.profile?.verification_status === 'approved') {
      navigate('/host/dashboard');
    }
  }, [user, navigate]);

  const verificationStatus = user?.profile?.verification_status;
  const rejectionReason = user?.profile?.verification_notes;

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="cyber-card border border-accent/30 p-8">
            {/* Icon */}
            <div className="flex flex-col items-center mb-8">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                  verificationStatus === 'rejected' ? 'bg-destructive/20' : 'bg-accent/20'
                }`}
              >
                {verificationStatus === 'rejected' ? (
                  <XCircle className="h-8 w-8 text-destructive" />
                ) : (
                  <Shield className="h-8 w-8 text-accent" />
                )}
              </div>

              <h1 className="text-2xl font-bold text-foreground tracking-tight text-center">
                {verificationStatus === 'rejected'
                  ? 'Application Rejected'
                  : 'Account Under Verification'}
              </h1>
              <p className="text-muted-foreground mt-2 text-center text-sm">
                {verificationStatus === 'rejected'
                  ? 'Your host application was not approved.'
                  : 'Your application is under review.'}
              </p>
            </div>

            {/* Status box */}
            {verificationStatus === 'pending' && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex gap-3 mb-6">
                <Clock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Verification Pending</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll notify you by email once our team reviews your application. This typically
                    takes 1–2 business days.
                  </p>
                </div>
              </div>
            )}

            {verificationStatus === 'rejected' && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3 mb-6">
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Reason</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rejectionReason ||
                      'Your application did not meet our requirements. Please contact support for details.'}
                  </p>
                </div>
              </div>
            )}

            {/* What happens next */}
            {verificationStatus !== 'rejected' && (
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  What happens next
                </p>
                <div className="space-y-2">
                  {[
                    'Our team reviews your application',
                    'You receive an email notification on any decision',
                    'On approval, your full host portal unlocks',
                    'Blue tick ✓ may be awarded for verified hosts',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-4 h-4 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        {i + 1}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support */}
            <div className="border-t border-border pt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span>
                Need help?{' '}
                <a
                  href="mailto:support@scrimverse.com"
                  className="text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  support@scrimverse.com
                </a>
              </span>
            </div>

            {/* Sign out button */}
            <button
              onClick={logout}
              className="w-full mt-4 py-2.5 px-4 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default HostVerificationPending;
