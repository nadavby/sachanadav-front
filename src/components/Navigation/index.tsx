/** @format */

import { FC, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUpload,
  faHome,
  faLightbulb
} from "@fortawesome/free-solid-svg-icons";
import NotificationBell from "../common/NotificationBell";
import "./styles.css"; // We'll create this file for custom styles

const Navigation: FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  return (
    <nav className="navbar navbar-dark bg-primary">
      <div className="container">
        {/* Left side: Logo */}
        <div className="order-0">
          <Link className="navbar-brand d-flex align-items-center" to="/" onClick={closeMenu}>
            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
            <span>Eureka</span>
          </Link>
        </div>
        
        {/* Center: Notification bell */}
        <div className="notification-center-container order-1">
          {!loading && isAuthenticated && (
            <NotificationBell />
          )}
        </div>
        
        {/* Right side: Hamburger button */}
        <button
          className="navbar-toggler order-2"
          type="button"
          onClick={toggleMenu}
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        {/* Collapsible menu (always collapsed by default) */}
        <div className={`navbar-collapse-container ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link
                to="/lost-items"
                className={`nav-link ${location.pathname === '/lost-items' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faSearch} className="me-1" />
                Lost Items
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/found-items"
                className={`nav-link ${location.pathname === '/found-items' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faSearch} className="me-1" />
                Found Items
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/upload-item"
                className={`nav-link ${location.pathname === '/upload-item' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faUpload} className="me-1" />
                Upload Item
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 