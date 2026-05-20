import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Users,
  Trophy,
  Shield,
  MessageSquare,
  Ban,
  Lock,
  Globe,
  Info,
  FileText,
  Edit,
  Gavel,
  Eye,
} from 'lucide-react';

const sections = [
  {
    icon: <Users className="h-5 w-5 text-primary" />,
    title: '1. Account Registration & Eligibility',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">Age Requirement</strong>
          <p>
            You must be at least 13 years old to create a ScrimVerse account. For players
            participating in official tournaments, the minimum age is 16 years as of the tournament
            registration close date, in line with KRAFTON's BGMI competition standards. Players aged
            16–17 require written consent from a parent or legal guardian prior to participation.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Account Responsibility</strong>
          <p>
            You are solely responsible for maintaining the confidentiality of your account
            credentials and all activity under your account. Notify us immediately at{' '}
            <a href="mailto:support@scrimverse.com" className="text-primary hover:underline">
              support@scrimverse.com
            </a>{' '}
            of any unauthorised use.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">One Account Policy</strong>
          <p>
            Each player is permitted one ScrimVerse account. Creating multiple accounts to exploit
            rewards, circumvent bans, or gain a competitive advantage (smurfing) is strictly
            prohibited and will result in permanent suspension of all associated accounts.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">
            National & Residency Requirements (Official BGMI)
          </strong>
          <p>
            For KRAFTON-recognised BGMI tournaments, players must be Indian nationals and must
            provide a valid government-issued ID (Aadhaar, Passport, Driving Licence, Student ID)
            upon request.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Ranking Requirements</strong>
          <p>
            For official BGMI tournaments, each player must hold a BGMI rank of Platinum I or above
            at Level 30+ at registration close. ScrimVerse reserves the right to verify and
            disqualify any ineligible player or team.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Trophy className="h-5 w-5 text-primary" />,
    title: '2. Tournament & Competition Rules',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">Binding Schedules</strong>
          <p>
            Once registered, teams commit to all scheduled match times. Failing to appear without
            prior written approval may result in match forfeiture, point deductions, or
            disqualification.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Gamer Tags & Team Names</strong>
          <p>
            Tags and team names may not include offensive language or third-party trademarks without
            documented written authorisation.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">
            Tournament Modifications & Publisher Compliance
          </strong>
          <p>
            ScrimVerse reserves the right to modify, suspend, delay, or cancel tournaments,
            schedules, formats, prize distributions, participation eligibility, or platform features
            at any time to comply with publisher requirements, legal obligations, technical issues,
            competitive integrity concerns, operational needs, or unforeseen circumstances.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Broadcast & Stream Ownership</strong>
          <p>
            All streams, recordings, and broadcasts of ScrimVerse tournaments are owned by
            ScrimVerse and/or the relevant rights holder (e.g. KRAFTON for official BGMI events).
            Players and teams may not independently stream official tournament matches without prior
            written permission.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Prize Distribution</strong>
          <p>
            Prizes are distributed to registered team owners after result verification and
            completion of all required documentation within 90 days. All taxes, including GST, are
            the sole responsibility of the winner. Prizes are non-transferable and paid in INR
            unless otherwise specified.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Prize Withholding Rights</strong>
          <p>
            ScrimVerse reserves the right to withhold, adjust, revoke, delay, or deny prize
            distributions pending investigations involving cheating allegations, eligibility
            verification, payment disputes, rule violations, fraudulent activity, suspicious
            conduct, or operational irregularities.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Payment & Refund Policy</strong>
          <p>
            Tournament entry fees, subscriptions, premium features, or other payments may be
            non-refundable except where explicitly stated otherwise. ScrimVerse reserves the right
            to issue refunds or payment adjustments at its sole discretion.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Dispute Timelines</strong>
          <p>
            Disputes regarding match results must be raised via official ScrimVerse support channels
            within 24 hours of match completion. Disputes raised after this window will not be
            reviewed. Contact us at{' '}
            <a href="mailto:support@scrimverse.com" className="text-primary hover:underline">
              support@scrimverse.com
            </a>{' '}
            or through the Report Issue page within the platform.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Shield className="h-5 w-5 text-primary" />,
    title: '3. Fair Play & Anti-Cheat Policy',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">Cheating</strong>
          <p>
            Use of any modified game client, cheat software, hardware cheating device, signalling
            device, or any method providing an unfair in-game advantage is strictly prohibited.
            Players found cheating face immediate disqualification, permanent account suspension and
            associated enforcement measures.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">
            Anti-Cheat Investigations & Competitive Integrity
          </strong>
          <p>
            ScrimVerse reserves the right to investigate suspected cheating, exploiting, account
            sharing, collusion, unauthorised software usage, unfair gameplay conduct, match-fixing,
            or manipulation of tournament results using available evidence, including gameplay
            footage, POV recordings, screenshots, device information, server logs, and player
            reports.
          </p>
          <p className="mt-2">
            Users may be required to provide additional verification materials, including in-game
            POV recordings, handcam recordings, screenshots, device verification, or match evidence
            for integrity review purposes. Failure to comply may result in penalties,
            disqualification, suspension, or prize forfeiture.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Collusion & Match Fixing</strong>
          <p>
            Any agreement between players or team members to not compete to a reasonable standard,
            including deliberately losing, pre-arranging outcomes, or match-fixing, is prohibited
            and subject to maximum penalties. Any player approached with a match-fixing request must
            report it to ScrimVerse immediately.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Competitive Integrity Discretion</strong>
          <p>
            ScrimVerse reserves the sole right to interpret tournament rules, investigate integrity
            concerns, and determine appropriate disciplinary actions necessary to preserve fair
            competition and platform integrity.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-primary" />,
    title: '4. Code of Conduct',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-2">Prohibited Behaviour</strong>
          <ul className="space-y-1 list-none">
            {[
              'Toxicity, harassment, or hate speech in any language directed at any community member, competitor, or ScrimVerse staff.',
              'Sexual harassment, discrimination, or denigration of any person or group.',
              'Doxxing — sharing personal information of others without consent.',
              'Impersonating ScrimVerse staff, tournament officials, or prominent players.',
              'Threats, intimidation, or violence of any kind at any event.',
              'Bribery — offering gifts or cash to influence match outcomes or official decisions.',
              'Refusing to comply with the instructions of ScrimVerse tournament officials.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-destructive mt-0.5 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong className="text-foreground block mb-1">LAN Event Conduct</strong>
          <p>
            Players must not invite unauthorised guests to event areas, must not smoke or consume
            alcohol on event premises, and must adhere to all venue rules.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Media Consent</strong>
          <p>
            By participating in ScrimVerse tournaments or events, users consent to photography,
            livestreaming, recording, broadcasting, and media capture for promotional, operational,
            archival, and marketing purposes.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Ban className="h-5 w-5 text-primary" />,
    title: '5. Prohibited Sponsor Categories',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-2">Red Flag List</strong>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              'Drugs & drug paraphernalia',
              'Tobacco & cannabis products',
              'Gambling & casinos',
              'Alcohol brands',
              'Adult / pornographic content',
              'Cryptocurrency platforms',
              'Skins gambling services',
              'Fantasy gaming (real money)',
              'In-game currency farming services',
              'Cheat software or services',
              'Online money gaming services',
              'Competitor games/platforms',
            ].map((item, i) => (
              <div
                key={i}
                className="bg-destructive/10 border border-destructive/20 rounded px-2 py-1 text-xs text-destructive"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <strong className="text-foreground block mb-1">
            Sponsorship & Branding Restrictions
          </strong>
          <p>
            ScrimVerse reserves the right to prohibit, reject, or restrict sponsorships,
            advertisements, branding, team names, logos, or promotional associations involving
            categories deemed inappropriate, unlawful, misleading, competitive-conflicting, or
            harmful to platform integrity.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Brand Conflict Compliance</strong>
          <p>
            Branded team or player names are permitted and reflected in leaderboards and creative
            assets. However, during live broadcasts, casters will not verbally mention conflicting
            brand names. Teams may not actively promote conflicting sponsors on their own digital
            platforms during the live stream window of any official ScrimVerse event.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Eye className="h-5 w-5 text-primary" />,
    title: '6. Intellectual Property',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">
            Publisher & Game Ownership Disclaimer
          </strong>
          <p>
            ScrimVerse is an independent esports platform and is not owned, operated, sponsored, or
            officially endorsed by KRAFTON, Inc., BATTLEGROUNDS MOBILE INDIA (BGMI), or any
            respective game publisher unless explicitly stated for a specific event or partnership.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">ScrimVerse Ownership</strong>
          <p>
            All content on the ScrimVerse platform, including logos, designs, software, text,
            graphics, tournament data, and recordings, is the intellectual property of ScrimVerse or
            its licensors. You are granted a limited, non-exclusive, non-transferable licence to use
            the platform for its intended competitive gaming purposes only.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Trademark Usage Restrictions</strong>
          <p>
            Users may not use the trademarks, branding, logos, intellectual property, or copyrighted
            material of ScrimVerse, game publishers, tournament organisers, sponsors, or third
            parties without proper authorisation or legal rights.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">User-Generated Content</strong>
          <p>
            Users remain fully responsible for all usernames, team names, logos, profile images,
            uploaded content, chat messages, media, and other content submitted through the
            platform. ScrimVerse reserves the right to remove, restrict, review, or moderate any
            content deemed offensive, infringing, abusive, unlawful, misleading, or harmful to the
            platform or community.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Grant of Rights by Participants</strong>
          <p>
            By participating in any ScrimVerse event, each participant grants ScrimVerse a
            royalty-free, worldwide, perpetual licence to use their name, Gamer Tag, likeness,
            image, voice, gameplay statistics, livestream footage, screenshots, rankings, match
            statistics, and biographical information for broadcasting, promoting, marketing, social
            media, archival, and operational purposes.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Lock className="h-5 w-5 text-primary" />,
    title: '7. Platform Abuse & Security',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <p className="mb-2">Users may not:</p>
          <ul className="space-y-1 list-none">
            {[
              'Interfere with platform operations',
              'Exploit vulnerabilities or bugs',
              'Automate activity using bots or scripts',
              'Scrape or copy platform data without authorisation',
              'Reverse engineer platform systems',
              'Overload infrastructure or attempt unauthorised access',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-destructive mt-0.5 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Any such activity may result in immediate suspension, termination, or legal action.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Third-Party Services</strong>
          <p>
            ScrimVerse may rely on third-party platforms, game publishers, payment providers,
            livestreaming services, hosting providers, communication services, or infrastructure
            providers. ScrimVerse is not responsible for outages, failures, delays, restrictions, or
            disruptions caused by third-party services outside its direct control.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Info className="h-5 w-5 text-primary" />,
    title: '8. Limitation of Liability',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">Service Availability</strong>
          <p>
            ScrimVerse provides services on an "as is" and "as available" basis. We do not guarantee
            uninterrupted platform availability, tournament continuity, ranking accuracy, server
            stability, matchmaking availability, or error-free operation at all times.
          </p>
          <p className="mt-2">
            ScrimVerse is not liable for service interruptions, lost data, or match results affected
            by technical issues beyond our control, including ISP failures, game server outages,
            cyberattacks, or acts of God.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Force Majeure</strong>
          <p>
            ScrimVerse shall not be held liable for delays, cancellations, disruptions, losses, or
            failures caused by circumstances beyond reasonable control, including internet outages,
            game server failures, cyberattacks, government actions, publisher restrictions, natural
            disasters, strikes, technical failures, or venue-related incidents.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Indemnification</strong>
          <p>
            Users agree to defend, indemnify, and hold harmless ScrimVerse, its operators, staff,
            affiliates, partners, sponsors, and service providers from any claims, liabilities,
            damages, losses, or expenses arising from:
          </p>
          <ul className="space-y-1 mt-2 list-none">
            {[
              'Violation of these Terms',
              'Misuse of the platform',
              'Infringement of third-party rights',
              'Tournament misconduct',
              'Unlawful activity',
              'User-generated content',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    icon: <Gavel className="h-5 w-5 text-primary" />,
    title: '9. Dispute Resolution',
    content: (
      <div className="space-y-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0 mt-0.5">
            1
          </span>
          <div>
            <strong className="text-foreground block mb-1">Informal Resolution</strong>
            <p>
              Contact ScrimVerse support at{' '}
              <a href="mailto:support@scrimverse.com" className="text-primary hover:underline">
                support@scrimverse.com
              </a>{' '}
              and attempt to resolve within 30 days. Tournament-specific disputes must be raised
              within 24 hours of the relevant match.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0 mt-0.5">
            2
          </span>
          <div>
            <strong className="text-foreground block mb-1">Arbitration</strong>
            <p>
              If informal resolution fails, disputes will be resolved by binding arbitration under
              the Arbitration and Conciliation Act, 1996 (India), with arbitration conducted in
              Bengaluru.
            </p>
          </div>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Jurisdiction</strong>
          <p>
            These Terms are governed by the laws of India. For matters not subject to arbitration,
            the courts of Bengaluru, Karnataka, shall have exclusive jurisdiction.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: <Globe className="h-5 w-5 text-primary" />,
    title: '10. Termination of Service',
    content: (
      <p className="text-sm text-muted-foreground">
        ScrimVerse reserves the right to suspend, restrict, discontinue, or terminate any account,
        tournament, feature, or platform access where necessary to protect platform integrity, legal
        compliance, operational stability, competitive fairness, or community safety.
      </p>
    ),
  },
  {
    icon: <Edit className="h-5 w-5 text-primary" />,
    title: '11. Changes to Terms',
    content: (
      <p className="text-sm text-muted-foreground">
        ScrimVerse may update these Terms at any time. Material changes will be communicated via the
        platform and/or registered email. Continued use after notification constitutes acceptance of
        the updated Terms.
      </p>
    ),
  },
  {
    icon: <FileText className="h-5 w-5 text-primary" />,
    title: '12. Non-Waiver & Severability',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <div>
          <strong className="text-foreground block mb-1">Non-Waiver</strong>
          <p>
            Failure by ScrimVerse to enforce any provision of these Terms shall not constitute a
            waiver of that provision or any other rights.
          </p>
        </div>
        <div>
          <strong className="text-foreground block mb-1">Severability</strong>
          <p>
            If any provision of these Terms is found unlawful, invalid, or unenforceable, the
            remaining provisions shall remain fully valid and enforceable.
          </p>
        </div>
      </div>
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
            <p className="text-sm text-muted-foreground mb-3">
              Effective Date: May 20, 2026 &nbsp;|&nbsp; Last Updated: May 20, 2026
            </p>
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
              Our support team is here to help you understand your rights and responsibilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/contact"
                className="gaming-button px-6 py-2.5 rounded-lg font-bold text-white text-sm"
              >
                Contact Support
              </Link>
              <a
                href="mailto:support@scrimverse.com"
                className="px-6 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
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

export default TermsPage;
