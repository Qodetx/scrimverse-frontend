import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Shield,
  Activity,
  Share2,
  Lock,
  Edit,
  Globe,
  Home,
  RefreshCw,
  FileText,
  Database,
  Camera,
} from 'lucide-react';

const sections = [
  {
    icon: <Activity className="h-5 w-5 text-primary" />,
    title: '1. Information We Collect',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">Account Information</strong>
          <p>Email address, username, password (securely hashed), authentication credentials.</p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Identity Verification Data</strong>
          <p>
            For official tournaments, ScrimVerse may request government-issued identification
            details, including Aadhaar Card, Passport, Driving Licence, PAN Card, or Student ID for
            eligibility verification, nationality checks, fraud prevention, prize processing, and
            tournament compliance requirements.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Gaming & Competition Data</strong>
          <p>
            Tournament registrations, Gamer Tags, team affiliations, rankings, match history,
            gameplay statistics, scrim participation, tournament performance, POV recordings,
            handcam recordings, screenshots, and competition-related submissions.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Device & Technical Data</strong>
          <p>
            We may automatically collect technical information such as IP address, browser type,
            device information, operating system, connection logs, and security-related data for
            platform functionality, analytics, fraud prevention, and security purposes.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Financial Data</strong>
          <p>
            We collect tournament registration payment records, transaction IDs, payment
            confirmations, UPI/payment details, and prize payout information where required for
            tournament operations and financial processing. ScrimVerse does not store complete debit
            or credit card information.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Media & Likeness Data</strong>
          <p>
            Photos, videos, livestream footage, voice communications, interviews, broadcasts,
            recordings, and promotional media captured during tournaments, livestreams, LAN events,
            or official media activities.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Activity className="h-5 w-5 text-primary" />,
    title: '2. How We Use Your Information',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">Platform & Tournament Operations</strong>
          <p>
            Managing user accounts, tournament registrations, scrim systems, team management,
            matchmaking, scheduling, leaderboards, rankings, event administration, and competition
            infrastructure.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">
            Prize Disbursement & Financial Compliance
          </strong>
          <p>
            Processing tournament entry fees, refunds, prize payments, taxation records, invoice
            generation, financial compliance obligations, and fraud prevention checks.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Broadcasting & Promotional Use</strong>
          <p>
            Using participant names, gamer tags, team names, gameplay footage, livestream content,
            rankings, statistics, interviews, and tournament media for broadcasting, promotional,
            social media, archival, sponsorship, and marketing purposes.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Communications</strong>
          <p>
            Sending tournament updates, registration confirmations, support responses, moderation
            notices, security alerts, announcements, and service-related communications.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Analytics & Platform Improvement</strong>
          <p>
            Monitoring platform usage, user behaviour, performance analytics, bug tracking, feature
            improvement, infrastructure optimisation, and service reliability.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Legal & Regulatory Compliance</strong>
          <p>
            Meeting obligations under applicable law, responding to lawful requests, maintaining
            records for dispute resolution, enforcing platform rules, and protecting users,
            partners, and platform integrity.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Share2 className="h-5 w-5 text-primary" />,
    title: '3. Information Sharing',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">What We Never Do</strong>
          <p>
            ScrimVerse does not sell personal information to advertisers, data brokers, or
            third-party marketing companies.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">
            Tournament Partners & Service Providers
          </strong>
          <p>
            ScrimVerse may share limited information with trusted tournament partners, payment
            providers, livestreaming platforms, analytics services, hosting providers, cloud
            infrastructure providers, customer support systems, and communication service providers
            where necessary for platform functionality, tournament operations, security, and payment
            processing.
          </p>
          <p className="mt-2">
            For official tournaments, ScrimVerse may share participant information with authorised
            tournament partners where necessary for tournament operations, eligibility verification,
            compliance enforcement, anti-cheat investigations, disciplinary proceedings,
            broadcasting, or competition administration.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Public Tournament Data</strong>
          <p>
            By participating in tournaments, users consent to the public display of usernames, team
            names, rankings, tournament standings, match results, gameplay statistics, and
            event-related competitive information on the platform, broadcasts, livestreams, social
            media, and promotional materials.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Legal Compliance & Safety</strong>
          <p>
            ScrimVerse may disclose user information where required by applicable law, court order,
            legal process, fraud investigation, security enforcement, or protection of users,
            rights, property, tournament integrity, or platform safety.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Disciplinary Disclosures</strong>
          <p>
            ScrimVerse reserves the right to publicly disclose usernames, Gamer Tags, team names,
            rankings, suspensions, bans, tournament penalties, and disciplinary outcomes related to
            cheating, fraud, match-fixing, or severe rule violations where necessary to preserve
            competitive integrity.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Lock className="h-5 w-5 text-primary" />,
    title: '4. Data Security',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-2">Security Measures</strong>
          <ul className="space-y-1 list-none">
            {[
              'SSL/TLS encryption for data transmitted through the platform.',
              'Secure storage practices for sensitive information where applicable.',
              'Restricted internal access to sensitive data.',
              'Fraud prevention and suspicious activity monitoring measures.',
              'Reasonable security practices designed to protect platform data.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Security Limitations</strong>
          <p>
            While ScrimVerse implements reasonable security measures to protect user information, no
            online platform or digital service can guarantee complete protection against
            cyberattacks, unauthorised access, technical failures, service interruptions, or data
            breaches.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Database className="h-5 w-5 text-primary" />,
    title: '5. Data Retention',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">Tournament Records</strong>
          <p>
            Tournament results, rankings, match history, and competition statistics may be retained
            for operational, historical, integrity, and dispute resolution purposes.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">POV & Handcam Recordings</strong>
          <p>
            POV/handcam recordings submitted for anti-cheat or tournament verification purposes may
            be retained for a minimum of ninety (90) days after tournament completion or longer
            where required for investigations or legal compliance.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Identity Verification Documents</strong>
          <p>
            Identity verification documents may be retained for the duration required for tournament
            operations, dispute resolution, fraud prevention, legal compliance, or audit
            requirements, after which they may be securely removed or deleted where applicable.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Financial Records</strong>
          <p>
            Payment records, invoices, and prize disbursement records may be retained for
            accounting, taxation, fraud prevention, and regulatory compliance obligations under
            Indian law.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Deleted Accounts</strong>
          <p>
            Users may request deletion of their account and personal data through official support
            channels. Certain information may continue to be retained where required for fraud
            prevention, legal compliance, active disputes, tournament integrity enforcement,
            security investigations, or accounting obligations.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Edit className="h-5 w-5 text-primary" />,
    title: '6. Your Rights & Choices',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>Users may have the right to:</p>
        <ul className="space-y-1 list-none">
          {[
            'Access personal data held by ScrimVerse.',
            'Correct inaccurate or outdated information.',
            'Request deletion of personal data.',
            'Request export of eligible account information.',
            'Object to marketing-related communications.',
            'Withdraw optional consents where applicable.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>
          To exercise these rights, contact:{' '}
          <a href="mailto:support@scrimverse.com" className="text-primary hover:underline">
            support@scrimverse.com
          </a>
        </p>
        <p>
          Certain requests may be limited where processing is required for legal obligations,
          tournament integrity, fraud prevention, dispute resolution, or active investigations.
        </p>
      </div>
    ),
  },
  {
    icon: <Globe className="h-5 w-5 text-primary" />,
    title: '7. Cookies & Tracking Technologies',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>ScrimVerse uses cookies and similar technologies for:</p>
        <ul className="space-y-1 list-none">
          {[
            'Authentication & login sessions',
            'Security & fraud prevention',
            'Platform functionality',
            'Analytics & usage insights',
            'User preferences & settings',
            'Performance optimisation',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary mt-0.5 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>
          Users may manage cookie preferences through browser settings, though disabling certain
          cookies may affect platform functionality.
        </p>
      </div>
    ),
  },
  {
    icon: <Home className="h-5 w-5 text-primary" />,
    title: "8. Children's Privacy",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          ScrimVerse is not intended for users under 13 years of age. We do not knowingly collect
          personal information from children under 13.
        </p>
        <p>
          For users aged 13–17 participating in tournaments, parental or legal guardian consent may
          be required depending on tournament rules and publisher requirements.
        </p>
        <p>
          If you believe a minor has provided information improperly, contact:{' '}
          <a href="mailto:support@scrimverse.com" className="text-primary hover:underline">
            support@scrimverse.com
          </a>
        </p>
      </div>
    ),
  },
  {
    icon: <FileText className="h-5 w-5 text-primary" />,
    title: '9. Cross-Border Data Processing',
    content: (
      <p className="text-sm text-muted-foreground">
        Certain infrastructure providers, tournament partners, or official game publishers may
        process data outside India where necessary for tournament operations, cloud infrastructure,
        broadcasting, analytics, or compliance purposes. Where applicable, reasonable safeguards and
        contractual protections may be implemented for such transfers.
      </p>
    ),
  },
  {
    icon: <Camera className="h-5 w-5 text-primary" />,
    title: '10. Third-Party Services',
    content: (
      <p className="text-sm text-muted-foreground">
        ScrimVerse may integrate or rely upon third-party services, including payment gateways,
        livestreaming services, hosting providers, analytics providers, communication tools,
        tournament systems, and cloud infrastructure providers. ScrimVerse is not responsible for
        independent policies, practices, outages, or actions of third-party services outside its
        direct control.
      </p>
    ),
  },
  {
    icon: <RefreshCw className="h-5 w-5 text-primary" />,
    title: '11. Policy Updates',
    content: (
      <p className="text-sm text-muted-foreground">
        ScrimVerse may modify or update this Privacy Policy periodically. Significant changes may be
        communicated through platform notifications, website announcements, or registered email
        communications. Continued use of the platform after updates become effective constitutes
        acceptance of the revised Privacy Policy.
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
            <p className="text-sm text-muted-foreground mb-3">
              Effective Date: May 19, 2026 &nbsp;|&nbsp; Last Updated: May 19, 2026
            </p>
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
              Our support team is available to answer any questions regarding your personal data.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:support@scrimverse.com"
                className="gaming-button px-6 py-2.5 rounded-lg font-bold text-white text-sm"
              >
                Email Support
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
