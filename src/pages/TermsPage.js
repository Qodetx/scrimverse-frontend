import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Users,
  Trophy,
  Shield,
  MessageSquare,
  Monitor,
  Lock,
  AlertTriangle,
  Info,
  FileText,
  Edit,
} from 'lucide-react';

const sections = [
  {
    icon: <Users className="h-5 w-5 text-primary" />,
    title: '1. Account Registration & Eligibility',
    content: (
      <ul className="space-y-3 text-sm text-muted-foreground list-none">
        <li>
          <strong className="text-foreground">Age Requirement:</strong> You must be at least 13
          years old to use ScrimVerse. If you are under 18, you must have parental consent.
        </li>
        <li>
          <strong className="text-foreground">Account Responsibility:</strong> You are responsible
          for maintaining the security of your account and password. ScrimVerse cannot and will not
          be liable for any loss from your failure to comply.
        </li>
        <li>
          <strong className="text-foreground">One Account Policy:</strong> Each player is allowed
          only one ScrimVerse account. Multi-accounting to exploit rewards or bypass bans will
          result in permanent suspension.
        </li>
      </ul>
    ),
  },
  {
    icon: <Trophy className="h-5 w-5 text-primary" />,
    title: '2. Tournament & Competition Rules',
    content: (
      <ul className="space-y-3 text-sm text-muted-foreground list-none">
        <li>
          <strong className="text-foreground">Binding Schedules:</strong> By registering for a
          tournament, you commit to the scheduled match times. Failing to show up may result in
          disqualification and rank penalties.
        </li>
        <li>
          <strong className="text-foreground">Prize Distribution:</strong> Prizes are distributed
          after result verification. Any taxes or fees associated with prizes are the responsibility
          of the winner.
        </li>
        <li>
          <strong className="text-foreground">Dispute Timelines:</strong> Any protests or disputes
          regarding match results must be raised through the proper channels within 24 hours of the
          match completion.
        </li>
      </ul>
    ),
  },
  {
    icon: <Shield className="h-5 w-5 text-primary" />,
    title: '3. Fair Play & Anti-Cheat Policy',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Integrity is the core of ScrimVerse. We have a zero-tolerance policy towards:</p>
        <ul className="space-y-2 list-none">
          <li>
            <strong className="text-foreground">Hacks & Exploits:</strong> Use of aimbots,
            wallhacks, or any third-party software that provides an unfair advantage.
          </li>
          <li>
            <strong className="text-foreground">Match Fixing:</strong> Intentionally losing or
            manipulating results for gain.
          </li>
          <li>
            <strong className="text-foreground">Smurfing:</strong> High-level players playing on
            low-rank accounts to exploit lower-tier competitions.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-primary" />,
    title: '4. Code of Conduct',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          All users must maintain a high standard of sportsmanship. Prohibited behaviors include:
        </p>
        <ul className="space-y-2 list-none">
          <li>Toxicity, harassment, or hate speech directed at any community member.</li>
          <li>Doxxing or sharing personal information of others without consent.</li>
          <li>Impersonating ScrimVerse staff or other prominent players.</li>
        </ul>
      </div>
    ),
  },
  {
    icon: <Monitor className="h-5 w-5 text-primary" />,
    title: '5. Intellectual Property',
    content: (
      <p className="text-sm text-muted-foreground">
        All content provided on the ScrimVerse platform, including logos, designs, text, and
        software, is the property of ScrimVerse. You are granted a limited, non-exclusive license to
        use the platform for its intended competitive purposes.
      </p>
    ),
  },
  {
    icon: <Lock className="h-5 w-5 text-primary" />,
    title: '6. Prohibited Activities',
    content: (
      <ul className="space-y-2 text-sm text-muted-foreground list-none">
        <li>Attempting to hack or breach the security of the ScrimVerse platform.</li>
        <li>Selling, trading, or transferring your ScrimVerse account to another individual.</li>
        <li>Engaging in "Real Money Trading" (RMT) for platform-exclusive digital assets.</li>
      </ul>
    ),
  },
  {
    icon: <AlertTriangle className="h-5 w-5 text-primary" />,
    title: '7. Penalties & Enforcement',
    wide: true,
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Level 1
          </span>
          <h4 className="font-semibold text-foreground mt-1 mb-1">Minor Violations</h4>
          <p className="text-xs text-muted-foreground">
            First-time behavior issues or minor rule confusion.
          </p>
          <p className="text-xs text-primary font-medium mt-2">
            Consequence: Warning & Rank Deduction
          </p>
        </div>
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Level 2
          </span>
          <h4 className="font-semibold text-foreground mt-1 mb-1">Moderate Violations</h4>
          <p className="text-xs text-muted-foreground">
            Toxicity, repeat offending, or unsportsmanlike conduct.
          </p>
          <p className="text-xs text-primary font-medium mt-2">
            Consequence: Temporary Ban (3-30 Days)
          </p>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <span className="text-xs font-bold uppercase tracking-widest text-destructive">
            Level 3
          </span>
          <h4 className="font-semibold text-foreground mt-1 mb-1">Critical Violations</h4>
          <p className="text-xs text-muted-foreground">
            Cheating, match-fixing, or extreme harassment.
          </p>
          <p className="text-xs text-destructive font-medium mt-2">
            Consequence: Permanent IP & Account Ban
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Info className="h-5 w-5 text-primary" />,
    title: '8. Limitation of Liability',
    content: (
      <p className="text-sm text-muted-foreground">
        ScrimVerse provides its services on an "as is" and "as available" basis. We are not liable
        for service interruptions, lost data, or match results affected by technical issues beyond
        our immediate control (e.g., ISP failures, game server outages).
      </p>
    ),
  },
  {
    icon: <FileText className="h-5 w-5 text-primary" />,
    title: '9. Dispute Resolution',
    content: (
      <ol className="space-y-3 text-sm text-muted-foreground list-none">
        {[
          'Informal Resolution: Contact support and attempt to resolve the issue within 30 days.',
          'Arbitration: If informal resolution fails, disputes will be settled via binding arbitration.',
          'Jurisdiction: Standard operations follow the legal jurisdiction of Bengaluru, India.',
        ].map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    icon: <Edit className="h-5 w-5 text-primary" />,
    title: '10. Changes to Terms',
    content: (
      <p className="text-sm text-muted-foreground">
        We may update our Terms from time to time. We will notify users of any significant changes
        via the platform or registered email. Continued use of the platform constitutes acceptance
        of the new terms.
      </p>
    ),
  },
];

const TermsPage = () => {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
          {/* Hero */}
          <header className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground mb-3">Effective Date: January 11, 2026</p>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Please read these terms carefully. By using ScrimVerse, you agree to follow the rules
              outlined below. We build these standards to ensure a fair, competitive, and respectful
              environment for every gamer.
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
            <h3 className="font-bold text-foreground mb-2">Questions about our Terms?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our legal team is here to help you understand your rights and responsibilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/contact"
                className="gaming-button px-6 py-2.5 rounded-lg font-bold text-white text-sm"
              >
                Contact Support
              </Link>
              <a
                href="mailto:legal@scrimverse.com"
                className="px-6 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Email Legal Team
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TermsPage;
