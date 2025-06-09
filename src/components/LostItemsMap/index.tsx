import React, { useState } from "react";
import { GoogleMap, InfoWindow, useJsApiLoader, OverlayView, Libraries } from "@react-google-maps/api";
import { useLostItems } from "../../hooks/useItems";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHome,
  faMapMarkedAlt,
  faList,
  faUser,
  faSignOutAlt,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../hooks/useAuth";
import "./LostItemsMap.css";

const containerStyle = {
  width: "100%",
  height: "600px"
};

const center = {
  lat: 32.0853, // תל אביב
  lng: 34.7818
};

// Define libraries array as a static constant
const libraries: Libraries = ["marker"];

const getLatLng = (location: any) => {
  if (!location) return null;
  if (typeof location === "string") {
    // תומך במבנה 'Lat: 31.6847, Lng: 34.5700'
    const match = location.match(/Lat:\s*([\d.\-]+),\s*Lng:\s*([\d.\-]+)/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    try {
      const parsed = JSON.parse(location);
      if (parsed.lat && parsed.lng) return { lat: parsed.lat, lng: parsed.lng };
    } catch {
      return null;
    }
  }
  if (location.lat && location.lng) return { lat: location.lat, lng: location.lng };
  return null;
};

const LostItemsMap: React.FC = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAlx_vvH0P5fepk8bHpzO54syb5heCvJXI",
    libraries: libraries
  });

  const { items, isLoading, error, refreshItems } = useLostItems();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleRefresh = () => {
    refreshItems();
  };

  const menuItems = [
    { icon: faHome, label: "Home", onClick: () => navigate("/") },
    { icon: faMapMarkedAlt, label: "Map", onClick: () => navigate("/map") },
    { icon: faList, label: "Lost Items", onClick: () => navigate("/lost-items") },
    { icon: faUser, label: "Profile", onClick: () => navigate("/profile") },
    { icon: faSignOutAlt, label: "Logout", onClick: handleLogout }
  ];

  if (!isLoaded || isLoading) {
    return (
      <div className="map-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          minHeight: '400px'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          minHeight: '400px',
          color: 'red'
        }}>
          Error loading items: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div style={{ direction: "rtl", width: "100%", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: "20px 0" }}>
          <h2 style={{ textAlign: "center", margin: 0 }}>Lost Items Map</h2>
          <button 
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#f0f0f0',
              cursor: 'pointer'
            }}
          >
            Refresh Items
          </button>
        </div>
        
        <GoogleMap 
          mapContainerStyle={containerStyle} 
          center={center} 
          zoom={13}
        >
          {items && items.length > 0 && items.map(item => {
            const pos = getLatLng(item.location);
            if (!pos) return null;
            const imageUrl = item.imageUrl;

            return (
              <React.Fragment key={item._id}>
                <OverlayView
                  position={pos}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={(width, height) => ({
                    x: -(width / 2),
                    y: -height
                  })}
                >
                  <div 
                    style={{
                      cursor: 'pointer',
                      padding: '2px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 2px 7px 1px rgba(0,0,0,0.3)',
                      transform: 'translateY(-60px)',
                    }}
                    onClick={() => setSelectedItemId(item._id || "")}
                  >
                    <img
                      src={imageUrl}
                      alt={item.name}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'contain',
                        borderRadius: '6px',
                      }}
                    />
                  </div>
                </OverlayView>

                {selectedItemId === item._id && (
                  <InfoWindow
                    position={pos}
                    onCloseClick={() => setSelectedItemId(null)}
                  >
                    <div style={{ textAlign: "center", minWidth: 120 }}>
                      <img src={imageUrl} alt={item.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
                      <div style={{ fontWeight: "bold" }}>{item.name}</div>
                      <div style={{ fontSize: 13 }}>{item.description}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{typeof item.location === 'string' ? item.location : ''}</div>
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
      </div>
    </div>
  );
};

export default LostItemsMap; 