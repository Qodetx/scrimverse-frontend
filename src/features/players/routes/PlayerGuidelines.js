import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import {
  Users,
  CheckCircle2,
  Shield,
  Check,
  X,
  HelpCircle,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';

const PlayerGuidelines = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Hero */}
          <header className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Community Standards
            </span>
            <h1 className="text-4xl font-bold text-foreground tracking-tight mt-4 mb-3">
              Player Guidelines
            </h1>
            <p className="text-muted-foreground text-lg">
              Rules and behavioral standards for the Scrimverse community.
            </p>
          </header>

          {/* Fundamental Principles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Users className="h-6 w-6 text-primary" />,
                title: 'Respectful Conduct',
                text: 'Treat all players, organizers, and staff with courtesy. Harassment or toxicity is not tolerated.',
              },
              {
                icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
                title: 'Fair Play',
                text: 'Competitors must play to the best of their ability while following all game and tournament rules.',
              },
              {
                icon: <Shield className="h-6 w-6 text-primary" />,
                title: 'Community Safety',
                text: 'Maintain a safe environment. Report any suspicious or harmful behavior immediately.',
              },
            ].map((card) => (
              <div key={card.title} className="cyber-card p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  {card.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.text}</p>
              </div>
            ))}
          </div>

          {/* Tournament Rules */}
          <section>
            <div className="text-center mb-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                Regulations
              </span>
              <h2 className="text-2xl font-bold text-foreground mt-3">Tournament Rules</h2>
            </div>
            <div className="cyber-card divide-y divide-border">
              {[
                {
                  num: '01',
                  title: 'No Cheating',
                  desc: 'Use of any third-party software, exploits, or hacks is strictly prohibited.',
                },
                {
                  num: '02',
                  title: 'Accurate Info',
                  desc: 'Players must provide correct IGNs and team details during registration.',
                },
                {
                  num: '03',
                  title: 'Punctuality',
                  desc: 'Be ready at least 15 minutes before the scheduled match time.',
                },
                {
                  num: '04',
                  title: 'Result Reporting',
                  desc: 'Winners must upload clear screenshots as proof of victory within the specified time.',
                },
              ].map((rule) => (
                <div key={rule.num} className="flex items-start gap-4 p-5">
                  <span className="text-2xl font-bold text-primary/40 font-mono flex-shrink-0 w-8">
                    {rule.num}
                  </span>
                  <div>
                    <h4 className="font-semibold text-foreground mb-0.5">{rule.title}</h4>
                    <p className="text-sm text-muted-foreground">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Violation Levels */}
          <section>
            <div className="text-center mb-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                Enforcement
              </span>
              <h2 className="text-2xl font-bold text-foreground mt-3">
                Violation Levels & Consequences
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="cyber-card p-5">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Level 1
                </span>
                <h3 className="font-semibold text-foreground mt-1 mb-2">Low Severity</h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Issues:</strong> Minor rule confusion or
                  first-time minor behavior issues.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong className="text-foreground">Consequences:</strong> Warning, temporary
                  restrictions, short suspension.
                </p>
              </div>
              <div className="cyber-card p-5 border-primary/20">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Level 2
                </span>
                <h3 className="font-semibold text-foreground mt-1 mb-2">Medium Severity</h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Issues:</strong> Toxicity, unsportsmanlike
                  conduct, or repeat minor violations.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong className="text-foreground">Consequences:</strong> Immediate suspension,
                  tournament bans, extended restrictions.
                </p>
              </div>
              <div className="cyber-card p-5 bg-destructive/5 border-destructive/20">
                <span className="text-xs font-bold uppercase tracking-widest text-destructive">
                  Level 3
                </span>
                <h3 className="font-semibold text-foreground mt-1 mb-2">High Severity</h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Issues:</strong> Cheating, match fixing,
                  Doxxing, or extreme toxicity.
                </p>
                <p className="text-sm text-destructive mt-1 font-medium">
                  Permanent ban, account termination, legal action.
                </p>
              </div>
            </div>
          </section>

          {/* Do's and Don'ts */}
          <section>
            <div className="text-center mb-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                Best Practices
              </span>
              <h2 className="text-2xl font-bold text-foreground mt-3">Do's and Don'ts</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="cyber-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <span className="font-bold text-foreground">Do's</span>
                </div>
                <ul className="space-y-3">
                  {[
                    'Practice good sportsmanship win or lose.',
                    'Help new players learn the ropes.',
                    'Report issues constructively to organizers.',
                    'Stay updated on rule changes for your games.',
                    'Maintain consistent performance standards.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="cyber-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <X className="h-4 w-4 text-destructive" />
                  </div>
                  <span className="font-bold text-foreground">Don'ts</span>
                </div>
                <ul className="space-y-3">
                  {[
                    'Blame teammates or opponents for losses.',
                    'Share personal information (Doxxing).',
                    'Engage in arguments during live matches.',
                    'Use external communication to circumvent rules.',
                    'Abandon matches without valid reason.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-destructive mt-0.5 flex-shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="cyber-card p-8 text-center border border-primary/20">
            <h2 className="text-xl font-bold text-foreground mb-5">Questions or Concerns?</h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/help"
                className="gaming-button inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white text-sm"
              >
                <HelpCircle className="h-4 w-4" />
                Visit Help Center
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Support
              </Link>
              <Link
                to="/report-issue"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <AlertCircle className="h-4 w-4" />
                Report Violation
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PlayerGuidelines;
