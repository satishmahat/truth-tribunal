import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiLinkedin, FiMail, FiHeart } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-2xl font-medium tracking-tight text-red-700 select-none flex items-center gap-2 mb-4">
              Truth Tribunal
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Advanced fake news detection and sentiment analysis system powered by artificial intelligence. 
              Helping users identify misinformation and understand content sentiment for better digital literacy.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-red-600 text-sm transition">Home</Link>
              </li>
              <li>
                <Link to="/detect" className="text-gray-400 hover:text-red-600 text-sm transition">Detect News</Link>
              </li>
              <li>
                <Link to="/sentiment" className="text-gray-400 hover:text-red-600 text-sm transition">Sentiment Analysis</Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-400 hover:text-red-600 text-sm transition">News Articles</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Connect</h3>
            <div className="space-y-3">
              <a 
                href="mailto:contact@truthtribunal.com" 
                className="flex items-center gap-2 text-gray-400 hover:text-red-600 text-sm transition"
              >
                <FiMail className="text-base" />
                Contact Us
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-red-600 text-sm transition"
              >
                <FiGithub className="text-base" />
                GitHub
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-red-600 text-sm transition"
              >
                <FiLinkedin className="text-base" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>© {currentYear} Truth Tribunal. All rights reserved.</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Made by : </span>
              <span className='text-red-700'>Ajit, Akriti, Satish</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
