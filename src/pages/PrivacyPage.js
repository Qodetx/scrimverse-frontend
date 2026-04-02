import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Shield, Activity, Share2, Lock, Edit, Globe, Home, RefreshCw } from 'lucide-react';

const sections = [
  {
    icon: <Activity className="h-5 w-5 text-primary" />,
    title: '1. Information We Collect',
    content: (
      <ul className="space-y-3 text-sm text-muted-foreground list-none">
        <li>
          <strong className="text-foreground">Account Information:</strong> Email address, username,
          and authentication credentials.
        </li>
        <li>
          <strong className="text-foreground">Gaming Data:</strong> In-game statistics, match
          history, team affiliations, and tournament performance.
        </li>
        <li>
          <strong className="text-foreground">Device Information:</strong> IP address, browser type,
          operating system, and device identifiers.
        </li>
        <li>
          <strong className="text-foreground">Usage Data:</strong> Pages visited, features used, and
          time spent on the platform.
        </li>
      </ul>
    ),
  },
  {
    icon: <Activity className="h-5 w-5 text-primary" />,
    title: '2. How We Use Your Information',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>We use your data to power the ScrimVerse experience:</p>
        <ul className="space-y-2 list-none">
          <li>
            <strong className="text-foreground">Service Delivery:</strong> Managing tournaments,
            scrimmages, and account features.
          </li>
          <li>
            <strong className="text-foreground">Leaderboards:</strong> Calculating and displaying
            player rankings and statistics globally.
          </li>
          <li>
            <strong className="text-foreground">Communication:</strong> Sending updates, security
            alerts, and platform announcements.
          </li>
          <li>
            <strong className="text-foreground">Analytics:</strong> Improving our platform features
            and understanding user behavior.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: <Share2 className="h-5 w-5 text-primary" />,
    title: '3. Information Sharing',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          We respect your data. We never sell your personal information. Sharing occurs only for:
        </p>
        <ul className="space-y-2 list-none">
          <li>
            <strong className="text-foreground">Public Profiles:</strong> Your username and gaming
            stats are visible to other community members.
          </li>
          <li>
            <strong className="text-foreground">Tournament Data:</strong> Results and team info
            shared with relevant tournament organizers.
          </li>
          <li>
            <strong className="text-foreground">Legal Compliance:</strong> Sharing required by law
            or to protect our community from fraud.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: <Lock className="h-5 w-5 text-primary" />,
    title: '4. Data Security',
    content: (
      <p className="text-sm text-muted-foreground">
        We implement industry-standard security measures, including SSL/TLS encryption and secure
        database storage, to protect your data from unauthorized access or disclosure.
      </p>
    ),
  },
  {
    icon: <Edit className="h-5 w-5 text-primary" />,
    title: '5. Your Rights & Choices',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>You have full control over your data:</p>
        <ul className="space-y-2 list-none">
          <li>
            <strong className="text-foreground">Access & Correction:</strong> View and update your
            profile details at any time.
          </li>
          <li>
            <strong className="text-foreground">Data Deletion:</strong> Request the permanent
            removal of your account and personal data.
          </li>
          <li>
            <strong className="text-foreground">Email Opt-out:</strong> Unsubscribe from marketing
            communications via account settings.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: <Globe className="h-5 w-5 text-primary" />,
    title: '6. Cookies & Tracking',
    content: (
      <p className="text-sm text-muted-foreground">
        We use essential cookies to keep you logged in and analytics cookies to improve our
        services. You can manage cookie preferences through your browser settings.
      </p>
    ),
  },
  {
    icon: <Home className="h-5 w-5 text-primary" />,
    title: "7. Children's Privacy",
    content: (
      <p className="text-sm text-muted-foreground">
        ScrimVerse is not intended for users under the age of 13. We do not knowingly collect
        personal information from children. If we discover such data, we will delete it immediately.
      </p>
    ),
  },
  {
    icon: <RefreshCw className="h-5 w-5 text-primary" />,
    title: '8. Changes to This Policy',
    content: (
      <p className="text-sm text-muted-foreground">
        We may update this Privacy Policy periodically. Significant changes will be announced on our
        platform or sent to your registered email address.
      </p>
    ),
  },
];

const PrivacyPage = () => {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
          {/* Hero */}
          <header className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground mb-3">Last Updated: January 11, 2026</p>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your privacy matters to us. Learn how ScrimVerse collects, uses, and protects your
              information to provide a secure and competitive gaming experience.
            </p>
          </header>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx} className="cyber-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    {section.icon}
                  </div>
                  <h2 className="font-bold text-foreground">{section.title}</h2>
                </div>
                {section.content}
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="cyber-card p-6 text-center border border-primary/20">
            <h3 className="font-bold text-foreground mb-2">Need more information?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our privacy team is available to answer any questions regarding your personal data.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:privacy@scrimverse.com"
                className="gaming-button px-6 py-2.5 rounded-lg font-bold text-white text-sm"
              >
                Email Privacy Team
              </a>
              <a
                href="mailto:support@scrimverse.com"
                className="px-6 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                General Support
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PrivacyPage;
