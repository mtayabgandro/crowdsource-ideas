import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">CrowdSource</h3>
          <p className="footer-description">
            Empowering innovation through collaborative ideas, questions, and discussions.
            Join our community to share knowledge and build the future together.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Quick Links</h4>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/explore">Explore</a></li>
            <li><a href="/create">Create Post</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Community</h4>
          <ul className="footer-links">
            <li><a href="/explore?type=question">Questions</a></li>
            <li><a href="/explore?type=idea">Ideas</a></li>
            <li><a href="/explore?type=blog">Blogs</a></li>
            <li><a href="/explore?type=discussion">Discussions</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Connect</h4>
          <div className="social-links">
            <a href="#" className="social-link">Twitter</a>
            <a href="#" className="social-link">LinkedIn</a>
            <a href="#" className="social-link">GitHub</a>
            <a href="#" className="social-link">Discord</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 CrowdSource. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
