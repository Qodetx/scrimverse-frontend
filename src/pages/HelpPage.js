import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Trophy,
  Users,
  Settings,
  Shield,
  ChevronDown,
  ChevronUp,
  Search,
  MessageCircle,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

const HelpPage = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const faqData = [
    {
      category: 'Tournaments & Competitions',
      description: 'Learn how to join tournaments, understand rules, and track your progress.',
      icon: Trophy,
      faqs: [
        {
          question: 'How to join a tournament',
          answer:
            "To join a tournament, navigate to the Tournaments page, find an event with 'Registration Open' status, click 'Register', and follow the steps to select your team and players. You'll need to complete payment if there's an entry fee.",
        },
        {
          question: 'Tournament rules and formats',
          answer:
            "Each tournament has specific rules set by the organizer. Common formats include Single Elimination, Double Elimination, Round Robin, and Swiss format. Always read the tournament rules before joining - you can find them in the tournament details under the 'Rules' tab.",
        },
        {
          question: 'Prize distribution',
          answer:
            'Prize distribution varies by tournament. Typically, prizes are split as follows: 1st place (50%), 2nd place (30%), and 3rd place (20%). The exact distribution is shown in the tournament details. Prizes are distributed within 48 hours after tournament completion.',
        },
        {
          question: 'Ranking system',
          answer:
            'Our ranking system is based on tournament performance. You earn points for wins, placements, and kills. Rankings are updated after each tournament: Elite (Top 5%), Pro (Top 15%), Advanced (Top 30%), and Rising (remaining players).',
        },
      ],
    },
    {
      category: 'Team Management',
      description: 'Everything about creating teams, inviting members, and team coordination.',
      icon: Users,
      faqs: [
        {
          question: 'Creating your team',
          answer:
            "Go to the Teams page and click 'Create Team'. Enter your team name, add a description and logo, then invite members using their username or email. You'll become the team owner with full management permissions.",
        },
        {
          question: 'Managing team members',
          answer:
            "As a team owner, you can add/remove members, assign roles (IGL, Fragger, Support, etc.), and manage permissions. Go to your team page and click 'Manage Team' to access these options. Members can be promoted to co-leaders.",
        },
        {
          question: 'Team communication',
          answer:
            'Use the built-in team chat to coordinate with your teammates. You can share strategies, schedule practice sessions, and discuss tournament participation. Team chat is private and only visible to team members.',
        },
        {
          question: 'Team statistics',
          answer:
            "View your team's performance on the team page. Statistics include win rate, total matches, tournaments won, and individual player contributions. Use these insights to identify strengths and areas for improvement.",
        },
      ],
    },
    {
      category: 'Account & Profile',
      description: 'Manage your account settings, profile customization, and preferences.',
      icon: Settings,
      faqs: [
        {
          question: 'Profile setup',
          answer:
            'Complete your profile by adding your IGN (In-Game Name), preferred games, and avatar. A complete profile helps tournament organizers and teammates find you. Go to Dashboard > Profile Settings to update your information.',
        },
        {
          question: 'Account security',
          answer:
            'Protect your account by using a strong password and enabling two-factor authentication. Never share your login credentials. If you suspect unauthorized access, change your password immediately and contact support.',
        },
        {
          question: 'Notification settings',
          answer:
            'Customize which notifications you receive in Settings > Notifications. Options include tournament reminders, team invites, match alerts, and promotional updates. You can choose email, push, or in-app notifications.',
        },
        {
          question: 'Privacy controls',
          answer:
            'Control your profile visibility in Settings > Privacy. Options include making your profile public, private, or visible only to friends. You can also control who can send you team invites and direct messages.',
        },
      ],
    },
    {
      category: 'Safety & Guidelines',
      description: 'Community guidelines, reporting systems, and platform safety.',
      icon: Shield,
      faqs: [
        {
          question: 'Community guidelines',
          answer:
            'We expect all players to maintain respectful behavior. This includes fair play, no cheating, respectful communication, and sportsmanship. Violations result in warnings, temporary bans, or permanent account suspension depending on severity.',
        },
        {
          question: 'Reporting inappropriate behavior',
          answer:
            "Report violations using the 'Report' button on profiles, in chat, or during matches. Provide evidence when possible (screenshots, recordings). Our moderation team reviews all reports within 24 hours.",
        },
        {
          question: 'Account safety tips',
          answer:
            "Keep your account safe: use unique passwords, don't share account access, verify links before clicking, and be cautious of phishing attempts. Official ScrimVerse communications only come from @scrimverse.com emails.",
        },
        {
          question: 'Fair play rules',
          answer:
            'Fair play includes no hacking, exploiting bugs, smurfing, or intentional disconnects. Use of unauthorized third-party software results in permanent bans. We use anti-cheat systems and manual reviews to maintain integrity.',
        },
      ],
    },
  ];

  const stillHelpCards = [
    {
      title: 'Contact Support',
      description: 'Get direct help from our team',
      link: '/contact',
      icon: MessageCircle,
    },
    {
      title: 'Report an Issue',
      description: 'Report bugs or problems',
      link: '/report-issue',
      icon: AlertCircle,
    },
    {
      title: 'Player Guidelines',
      description: 'Learn our community rules',
      link: '/player-guidelines',
      icon: BookOpen,
    },
  ];

  const toggleAccordion = (categoryIndex, faqIndex) => {
    const key = `${categoryIndex}-${faqIndex}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredFaqs = faqData
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.faqs.length > 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Header section with border-b divider — matches Lovable */}
        <div className="border-b border-border bg-background/95 backdrop-blur pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                ScrimVerse Help Center
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find answers to your questions and learn how to make the most of ScrimVerse
              </p>
              {/* Search */}
              <div className="relative max-w-md mx-auto pt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* FAQ Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {(searchQuery ? filteredFaqs : faqData).map((category, catIdx) => (
              <div key={catIdx} className="cyber-card rounded-lg">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground text-lg">{category.category}</h2>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mt-4">
                    {category.faqs.map((faq, faqIdx) => {
                      const isOpen = openItems[`${catIdx}-${faqIdx}`];
                      return (
                        <li key={faqIdx}>
                          <button
                            className="w-full flex items-center justify-between px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                            onClick={() => toggleAccordion(catIdx, faqIdx)}
                          >
                            <span className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              {faq.question}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-3 py-3 ml-6 text-sm text-muted-foreground bg-secondary/30 rounded-lg mt-1">
                              {faq.answer}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {searchQuery && filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No results found</h3>
              <p className="text-muted-foreground">
                Try different keywords or browse the categories above
              </p>
            </div>
          )}

          {/* Still Need Help */}
          <div className="cyber-card rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-center bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Still need help?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stillHelpCards.map((card, idx) => (
                <Link
                  key={idx}
                  to={card.link}
                  className="flex flex-col items-center text-center p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-secondary/30 transition-all gap-2"
                >
                  <card.icon className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-foreground">{card.title}</span>
                  <span className="text-xs text-muted-foreground">{card.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default HelpPage;
