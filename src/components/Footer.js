import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Linkedin } from 'lucide-react';
import logo from '../assets/scrimverse-logo-bgTransparant.png';
import './Footer.css';

const Footer = () => {
  return (
    <footer
      className="relative overflow-hidden border-t border-white/10"
      style={{ background: 'linear-gradient(180deg, hsl(0 0% 6%) 0%, hsl(0 0% 4%) 100%)' }}
    >
      {/* Large Background Watermark Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden pb-12">
        <img
          src={logo}
          alt=""
          className="w-[12rem] sm:w-[24rem] md:w-[32rem] lg:w-[48rem] opacity-[0.04] grayscale brightness-0 invert pointer-events-none select-none"
          style={{ transform: 'rotate(-5deg)' }}
        />
      </div>

      <div className="container mx-auto px-6 py-14 relative z-10 w-full max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-2">
            <div className="h-10 flex items-center overflow-visible -ml-16">
              <img
                src={logo}
                alt="ScrimVerse"
                className="h-40 w-auto object-contain pointer-events-none"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The ultimate platform for competitive gaming tournaments and scrimmages. Join
              thousands of players competing for glory and prizes.
            </p>
            <div className="flex space-x-4 pt-1">
              <a
                href="https://www.instagram.com/scrimversee?igsh=MTJzeWJtZW1maG93Yw%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.linkedin.com/in/dhiraj-kumar-5b792b371"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Support</h3>
            <ul className="space-y-2.5">
              {[
                { to: '/help', label: 'Help Center' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/report-issue', label: 'Report Issue' },
                { to: '/player-guidelines', label: 'Player Guidelines' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contact</h3>
            <div className="space-y-3">
              <a
                href="mailto:support@scrimverse.com"
                className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Mail size={16} className="shrink-0" />
                <span>support@scrimverse.com</span>
              </a>
              <a
                href="tel:+918867495185"
                className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Phone size={16} className="shrink-0" />
                <span>+91 8867495185</span>
              </a>
              <div className="flex items-center space-x-3 text-gray-400 text-sm">
                <MapPin size={16} className="shrink-0" />
                <span>India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
            <p className="text-gray-400 text-sm text-center md:text-right">
              © {new Date().getFullYear()} ScrimVerse. All rights reserved.{' '}
              <span className="text-white font-medium">Powered by ScrimVerse</span> • Built for the
              community, powered by competition.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
