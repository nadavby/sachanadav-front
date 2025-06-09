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
  faQrcode
} from "@fortawesome/free-solid-svg-icons";
import UserQRCode from "../UserQRCode";
import "./styles.css"; 

const Navigation: FC = () => {
  const { isAuthenticated, loading, currentUser } = useAuth();
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

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match SVG (with some padding)
    canvas.width = 320; // Double the QR size for better quality
    canvas.height = 320;

    // Create a Blob from the SVG
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create an Image object
    const img = new Image();
    img.onload = () => {
      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image centered
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to data URL and trigger download
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
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .qr-container { text-align: center; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div id="qr-code"></div>
            </div>
          </body>
        </html>
      `);
      const qrElement = document.getElementById('qr-dropdown')?.cloneNode(true);
      if (qrElement) {
        printWindow.document.getElementById('qr-code')?.appendChild(qrElement);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
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
              )}
              <button 
                className="btn btn-profile me-3" 
                onClick={() => navigate("/profile")}
                title="My Profile"
                aria-label="Go to user profile"
              >
                <FontAwesomeIcon icon={faUserCircle} size="lg" />
              </button>
              
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
              </ul>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 