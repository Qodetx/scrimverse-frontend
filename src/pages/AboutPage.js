import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Shield,
  Users,
  Star,
  Heart,
  Trophy,
  UserPlus,
  Target,
  Award,
  Zap,
  HeadphonesIcon,
  Gamepad2,
} from 'lucide-react';

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16 pt-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              About ScrimVerse
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              We&apos;re building the ultimate gaming ecosystem where players connect, compete, and
              create lasting memories. ScrimVerse is more than a platform — it&apos;s a community
              where legends are born.
            </p>
          </div>

          {/* Mission Card */}
          <section className="mb-16">
            <div className="cyber-card p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    Our Mission
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    To democratize competitive gaming by providing a platform where every player,
                    regardless of skill level, can participate in tournaments, build meaningful
                    connections, and showcase their talent to the world.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                      <Gamepad2 className="h-24 w-24 text-primary" />
                    </div>
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Our Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Shield,
                  title: 'Fair Play',
                  desc: 'Equal opportunity for all players with strict anti-cheat measures.',
                },
                {
                  icon: Users,
                  title: 'Community',
                  desc: 'Building connections and friendships through competitive gaming.',
                },
                {
                  icon: Star,
                  title: 'Excellence',
                  desc: 'High-quality features and dedicated support for every user.',
                },
                {
                  icon: Heart,
                  title: 'Passion',
                  desc: 'Built by gamers who love and understand the community.',
                },
              ].map((v) => (
                <div key={v.title} className="cyber-card p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <v.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What Makes Us Different */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              What Makes Us Different
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Trophy,
                  title: 'Advanced Tournament System',
                  desc: 'Create custom brackets, manage multiple game modes, and track live statistics with our comprehensive tournament platform.',
                },
                {
                  icon: UserPlus,
                  title: 'Clan Management',
                  desc: 'Build and manage your gaming clan with recruitment tools, member tracking, and team coordination features.',
                },
                {
                  icon: Target,
                  title: 'Skill Matching',
                  desc: 'Algorithmic matchmaking ensures balanced and competitive gameplay for all skill levels.',
                },
                {
                  icon: Award,
                  title: 'Achievement System',
                  desc: 'Detailed player statistics, rankings, and achievement badges that showcase your journey.',
                },
                {
                  icon: Zap,
                  title: 'Real-time Updates',
                  desc: 'Instant notifications for match results, tournament updates, and team activities.',
                },
                {
                  icon: HeadphonesIcon,
                  title: '24/7 Support',
                  desc: 'Dedicated support team available around the clock for technical assistance.',
                },
              ].map((f) => (
                <div key={f.title} className="cyber-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">{f.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Built by Gamers */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Built by Gamers, For Gamers
            </h2>
            <div className="cyber-card p-8 text-center">
              <div className="max-w-3xl mx-auto">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Our team consists of passionate gamers, esports professionals, and tech
                  enthusiasts who understand the gaming community&apos;s needs. We&apos;ve been
                  where you are — grinding ranks, organizing scrims, and building teams.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <span className="bg-secondary border border-border text-foreground text-sm px-4 py-2 rounded-full flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Tournament Winners
                  </span>
                  <span className="bg-secondary border border-border text-foreground text-sm px-4 py-2 rounded-full flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Community Leaders
                  </span>
                  <span className="bg-secondary border border-border text-foreground text-sm px-4 py-2 rounded-full flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Tech Innovators
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Our Impact */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Our Impact
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: '10K+', label: 'Active Players' },
                { value: '500+', label: 'Tournaments' },
                { value: '₹50L+', label: 'Prize Money' },
                { value: '200+', label: 'Active Clans' },
              ].map((s) => (
                <div key={s.label} className="cyber-card p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {s.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mb-8">
            <div className="cyber-card p-12 text-center border border-primary/30">
              <h2 className="text-3xl font-bold text-foreground mb-4">Join the Revolution</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Be part of India&apos;s fastest-growing esports community. Compete, connect, and
                conquer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/player-auth"
                  className="gaming-button inline-flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white"
                >
                  <Heart className="h-5 w-5" />
                  Join Community
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
                >
                  <HeadphonesIcon className="h-5 w-5" />
                  Contact Us
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
