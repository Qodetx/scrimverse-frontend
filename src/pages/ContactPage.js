import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Phone, MessageCircle, Mail } from 'lucide-react';

const ContactPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! Our team will get back to you soon.');
  };

  const inputClass =
    'block w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all';

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
          {/* Hero */}
          <header className="text-center">
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-3">Contact Us</h1>
            <p className="text-muted-foreground text-lg">
              Get in touch for tournament listings, collaborations, or any queries
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Direct Contact */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-foreground">Get In Touch</h2>

              <div className="space-y-3">
                <div className="cyber-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">8867495185</p>
                    <p className="text-xs text-muted-foreground">
                      Available for calls and WhatsApp
                    </p>
                  </div>
                </div>

                <div className="cyber-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">8867495185</p>
                    <p className="text-xs text-muted-foreground">
                      Quick responses for urgent queries
                    </p>
                  </div>
                </div>

                <div className="cyber-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">support@scrimverse.com</p>
                    <p className="text-xs text-muted-foreground">
                      For detailed inquiries and partnerships
                    </p>
                  </div>
                </div>
              </div>

              <div className="cyber-card p-5 border border-primary/20">
                <h3 className="font-bold text-foreground mb-0.5">Dhiraj</h3>
                <span className="text-xs text-primary font-medium">Founder & CEO</span>
                <p className="text-sm text-muted-foreground mt-2">
                  Building the future of Indian esports
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-3">
              <div className="cyber-card p-6">
                <h2 className="text-lg font-bold text-foreground mb-5">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        placeholder="Your phone number"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="your.email@example.com"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Subject</label>
                    <select
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select a topic</option>
                      <option value="tournament">Tournament Listing</option>
                      <option value="partnership">Partnership / Collaboration</option>
                      <option value="support">Technical Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <textarea
                      name="message"
                      rows="5"
                      placeholder="Tell us about your tournament, collaboration idea, or any questions you have..."
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    className="gaming-button w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300"
                  >
                    SEND MESSAGE
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <section className="cyber-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-foreground">
                For Tournament Listings or Collaborations
              </h3>
              <p className="text-sm text-muted-foreground">
                Feel free to reach out via call or WhatsApp for quick responses
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="tel:8867495185"
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call Now
              </a>
              <a
                href="https://wa.me/8867495185"
                className="gaming-button inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ContactPage;
