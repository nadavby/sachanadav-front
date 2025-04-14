/** @format */

import { Routes, Route } from "react-router-dom";
import { Login } from "./Login";
import { RegistrationForm } from "./RegristrationForm";
import UserProfile from "./UserProfile";
import { useAuth } from "../hooks/useAuth";
import LostItems from "./LostItems";
import FoundItems from "./FoundItems";
import ItemUpload from "./ItemUpload";
import ItemDetail from "./ItemDetail";
import Navigation from "./Navigation";
import { NotificationsProvider } from "../hooks/useNotifications";
import NotificationProvider from "./NotificationProvider";
import MatchConfirmation from "./MatchConfirmation";

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  return (
    <NotificationsProvider>
      <NotificationProvider>
        <Navigation />
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <LostItems /> : <Login />}
          />
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/register"
            element={<RegistrationForm />}
          />
          <Route
            path="/lost-items"
            element={<LostItems />}
          />
          <Route
            path="/found-items"
            element={<FoundItems />}
          />
          <Route
            path="/profile"
            element={<UserProfile />}
          />
          <Route
            path="/upload-item"
            element={<ItemUpload />}
          />
          <Route
            path="/item/:itemId"
            element={<ItemDetail />}
          />
          <Route
            path="/item/:itemId/match/:matchId"
            element={<MatchConfirmation />}
          />
        </Routes>
      </NotificationProvider>
    </NotificationsProvider>
  );
}

export default App;
