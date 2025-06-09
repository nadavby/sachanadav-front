import { FC, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faSearch,
  faUpload,
  faLightbulb,
  faMapMarkerAlt,
  faQrcode,
  faComments,
  faBell
} from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationProvider from "../NotificationProvider";
import UserQRCode from "../UserQRCode";
import "./styles.css"; 

const Navigation: FC = () => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQRDropdownOpen, setIsQRDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleQRDropdown = () => {
    setIsQRDropdownOpen(!isQRDropdownOpen);
  };

  const handleDownload = () => {
    const svgElement = document.querySelector('#qr-dropdown svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 320;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svgElement = document.querySelector('#qr-dropdown svg');
    if (!svgElement) {
      printWindow.close();
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .qr-container {
              text-align: center;
            }
            .qr-code {
              width: 300px;
              height: 300px;
            }
            .print-title {
              font-family: Arial, sans-serif;
              color: #333;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2 class="print-title">Your Personal QR Code</h2>
            ${svgData}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };



  return (
    <nav className="navbar navbar-dark bg-primary">
      <div className="container">
        <div className="order-0">
          <Link className="navbar-brand d-flex align-items-center" to="/lost-items" onClick={closeMenu}>
            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
            <span>Eureka</span>
          </Link>
        </div>
        
        {!loading && isAuthenticated && (
          <>    
            <div className="d-flex align-items-center order-2">
              {currentUser && (
                <>
                  <div className="position-relative me-3">
                    <button 
                      className="btn btn-qr"
                      onClick={toggleQRDropdown}
                      title="My QR Code"
                      aria-label="Show QR code"
                    >
                      <FontAwesomeIcon icon={faQrcode} size="lg" />
                    </button>
                    
                    {isQRDropdownOpen && (
                      <div className="qr-dropdown" id="qr-dropdown">
                        <div className="qr-content">
                          <h3 className="qr-title">Your Personal QR Code</h3>
                          <p className="qr-description">
                            Print or save this QR code to help others find you when they discover your lost items
                          </p>
                          <UserQRCode userId={currentUser._id} />
                          <div className="qr-actions">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={handlePrint}
                            >
                              Print QR
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={handleDownload}
                            >
                              Save QR
                            </button>
                          </div>
                          <button 
                            className="btn btn-sm btn-link mt-2"
                            onClick={() => window.open(`${window.location.origin}/public-user/${currentUser._id}`, '_blank')}
                          >
                            Test QR Link →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn btn-profile me-3" 
                    onClick={() => navigate("/chats")}
                    title="My Chats"
                    aria-label="Go to chats"
                  >
                    <FontAwesomeIcon icon={faComments} size="lg" />
                  </button>
                  <NotificationProvider
                    notificationTrigger={
                      <button 
                        className="btn btn-profile notification-button me-3"
                        title="Notifications"
                        aria-label="View notifications"
                      >
                        <FontAwesomeIcon icon={faBell} size="lg" />
                        {unreadCount > 0 && (
                          <span className="notification-badge">{unreadCount}</span>
                        )}
                      </button>
                    }
                  >
                    {null}
                  </NotificationProvider>
                  <button 
                    className="btn btn-profile me-3" 
                    onClick={() => navigate("/profile")}
                    title="My Profile"
                    aria-label="Go to user profile"
                  >
                    <FontAwesomeIcon icon={faUserCircle} size="lg" />
                  </button>
                </>
              )}
              <button 
                className="navbar-toggler"
                type="button"
                onClick={toggleMenu}
                aria-controls="navbarNav"
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            </div>
            
            <div className={`navbar-collapse-container ${isMenuOpen ? 'show' : ''}`}>
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
                    to="/upload-item"
                    className={`nav-link ${location.pathname === '/upload-item' ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FontAwesomeIcon icon={faUpload} className="me-1" />
                    Upload Item
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/map"
                    className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                    Map
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/chats"
                    className={`nav-link ${location.pathname === '/chats' ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FontAwesomeIcon icon={faComments} className="me-1" />
                    Chats
                  </Link>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 