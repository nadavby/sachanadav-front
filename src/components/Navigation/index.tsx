/** @format */

import { FC } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faSignInAlt,
  faSignOutAlt,
  faSearch,
  faUpload,
  faHome
} from "@fortawesome/free-solid-svg-icons";
import NotificationBell from "../common/NotificationBell";

const Navigation: FC = () => {
  const { isAuthenticated, loading, currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <FontAwesomeIcon icon={faHome} className="me-2" />
          <span>TripBuddy</span>
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link
                    to="/lost-items"
                    className={`nav-link ${location.pathname === '/lost-items' ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faSearch} className="me-1" />
                    Lost Items
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/found-items"
                    className={`nav-link ${location.pathname === '/found-items' ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faSearch} className="me-1" />
                    Found Items
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/upload-item"
                    className={`nav-link ${location.pathname === '/upload-item' ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faUpload} className="me-1" />
                    Upload Item
                  </Link>
                </li>
              </>
            )}
          </ul>
          
          <ul className="navbar-nav">
            {!loading && (
              isAuthenticated ? (
                <>
                  <li className="nav-item">
                    <div className="nav-link">
                      <NotificationBell />
                    </div>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/profile"
                      className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                    >
                      <FontAwesomeIcon icon={faUser} className="me-1" />
                      {currentUser?.userName || 'Profile'}
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button
                      className="nav-link btn btn-link"
                      onClick={handleLogout}
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link
                      to="/login"
                      className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                    >
                      <FontAwesomeIcon icon={faSignInAlt} className="me-1" />
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/register"
                      className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                    >
                      <FontAwesomeIcon icon={faUser} className="me-1" />
                      Register
                    </Link>
                  </li>
                </>
              )
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 