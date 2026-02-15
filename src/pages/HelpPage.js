import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './HelpPage.css';

const HelpPage = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const faqData = [
    {
      category: 'Tournaments & Competitions',
      description: 'Learn how to join tournaments, understand rules, and track your progress.',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
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
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
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
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
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
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      ),
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
    },
    {
      title: 'Report an Issue',
      description: 'Report bugs or problems',
      link: '/report-issue',
    },
    {
      title: 'Player Guidelines',
      description: 'Learn our community rules',
      link: '/player-guidelines',
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
    <div className="help-center-wrapper">
      <div className="glow-overlay"></div>
      <div className="neon-border-top"></div>

      <header className="help-header">
        <h1 className="help-title">ScrimVerse Help Center</h1>
        <p className="help-subtitle">
          Everything you need to know about competing, hosting, and managing teams on ScrimVerse.
        </p>

        <div className="search-container">
          <div className="search-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            className="help-search-input"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="faq-grid">
        {(searchQuery ? filteredFaqs : faqData).map((category, catIdx) => (
          <div key={catIdx} className="category-card">
            <div className="category-header">
              <div className="category-icon">{category.icon}</div>
              <h2 className="category-title">{category.category}</h2>
            </div>
            <p className="category-desc">{category.description}</p>

            <div className="accordion-list">
              {category.faqs.map((faq, faqIdx) => {
                const isOpen = openItems[`${catIdx}-${faqIdx}`];
                return (
                  <div key={faqIdx} className="accordion-item">
                    <button
                      className="accordion-trigger"
                      onClick={() => toggleAccordion(catIdx, faqIdx)}
                    >
                      <span>{faq.question}</span>
                      <svg
                        className={`chevron-icon ${isOpen ? 'rotated' : ''}`}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                      <p className="answer-text">{faq.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      <section className="still-help-section">
        <h2 className="still-help-title">Still need help?</h2>
        <div className="help-cards-container">
          {stillHelpCards.map((card, idx) => {
            if (card.link.startsWith('http') || card.link.startsWith('mailto')) {
              return (
                <a key={idx} href={card.link} className="action-card">
                  <h3 className="action-card-title">{card.title}</h3>
                  <p className="action-card-desc">{card.description}</p>
                </a>
              );
            }
            return (
              <Link key={idx} to={card.link} className="action-card">
                <h3 className="action-card-title">{card.title}</h3>
                <p className="action-card-desc">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpPage;
