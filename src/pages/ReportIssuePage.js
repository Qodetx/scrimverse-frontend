import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Bug,
  Shield,
  Trophy,
  AlertTriangle,
  HelpCircle,
  MessageCircle,
  Upload,
  Send,
} from 'lucide-react';

const ReportIssuePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    issueType: '',
    priority: '',
    title: '',
    description: '',
    steps: '',
    anonymous: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for reporting this issue. Our team will investigate it within 24-48 hours.');
  };

  const issueTypes = [
    {
      id: 'bug',
      title: 'Technical Bug',
      desc: 'App crashes, errors, broken features',
      icon: <Bug className="h-5 w-5 text-primary" />,
    },
    {
      id: 'behavior',
      title: 'Inappropriate Behavior',
      desc: 'Harassment, cheating, rule violations',
      icon: <Shield className="h-5 w-5 text-primary" />,
    },
    {
      id: 'tournament',
      title: 'Tournament Issues',
      desc: 'Match disputes, scoring problems',
      icon: <Trophy className="h-5 w-5 text-primary" />,
    },
  ];

  const inputClass =
    'block w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all';

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          {/* Hero */}
          <header className="text-center">
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-3">
              Report an Issue
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Help us improve ScrimVerse by reporting bugs, inappropriate behavior, or other issues
              you encounter.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="cyber-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-sm">Issue Types</h2>
                    <p className="text-xs text-muted-foreground">
                      Select the type of issue you're experiencing
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {issueTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-start gap-3 p-3 bg-secondary/40 border border-border rounded-lg"
                    >
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        {type.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{type.title}</p>
                        <p className="text-xs text-muted-foreground">{type.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cyber-card p-5">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Need Help?</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/help"
                    className="flex items-center gap-2 px-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Help Center
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center gap-2 px-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-primary" />
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-3">
              <div className="cyber-card p-6">
                <h2 className="text-lg font-bold text-foreground mb-1">Report Details</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Please provide as much detail as possible to help us investigate.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Issue Type</label>
                      <select
                        name="issueType"
                        required
                        value={formData.issueType}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="">Select issue type</option>
                        <option value="bug">Technical Bug</option>
                        <option value="behavior">Inappropriate Behavior</option>
                        <option value="tournament">Tournament Issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Priority Level</label>
                      <select
                        name="priority"
                        required
                        value={formData.priority}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="">Select priority</option>
                        <option value="low">Low - Minor issue</option>
                        <option value="medium">Medium - Affects gameplay</option>
                        <option value="high">High - Critical/Blocking</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Issue Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Brief description of the issue"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Detailed Description
                    </label>
                    <textarea
                      name="description"
                      rows="5"
                      placeholder="Please describe the issue in detail..."
                      required
                      value={formData.description}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Steps to Reproduce (for bugs)
                    </label>
                    <textarea
                      name="steps"
                      rows="3"
                      placeholder="1. Go to... 2. Click on... 3. The issue occurs..."
                      value={formData.steps}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Screenshots/Evidence
                    </label>
                    <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 text-center bg-secondary/20">
                      <Upload className="h-7 w-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here or click to browse
                      </p>
                      <span className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 10MB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="anonymous"
                      name="anonymous"
                      checked={formData.anonymous}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-border bg-secondary accent-primary"
                    />
                    <label
                      htmlFor="anonymous"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Submit this report anonymously
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="gaming-button w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    SUBMIT REPORT
                  </button>

                  <p className="text-xs text-muted-foreground text-center">
                    Reports are reviewed within 24-48 hours. We'll contact you if we need additional
                    information.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ReportIssuePage;
