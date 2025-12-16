import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, getFullAvatarUrl } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Crowdsource Ideas
        </Link>
        <ul className="navbar-menu">
          <li><Link to="/" className="navbar-link">Home</Link></li>
          <li><Link to="/explore" className="navbar-link">Explore</Link></li>
          {user && <li><Link to="/create-post" className="navbar-link">Create Post</Link></li>}
          {user && <li><Link to="/dashboard" className="navbar-link">Dashboard</Link></li>}
        </ul>
        <div className="navbar-user-area">
          {user ? (
            <>
              <Link to={`/profile/${user._id}`} className="navbar-profile-link">
                <img src={getFullAvatarUrl(user.avatar)} alt={user.username} className="navbar-avatar" />
                <span>{user.username}</span>
              </Link>
              <button onClick={logout} className="navbar-button">Logout</button>
            </>
          ) : (
            <ul className="navbar-menu">
              <li><Link to="/login" className="navbar-link">Login</Link></li>
              <li><Link to="/register" className="navbar-link">Register</Link></li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
