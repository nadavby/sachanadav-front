/** @format */

import { Routes, Route } from "react-router-dom";
import { Login } from "./Login";
import { RegistrationForm } from "./RegristrationForm";
import PostList from "./PostList";
import UserProfile from "./UserProfile";
import CreatePost from "./CreatePost";

function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Login />}
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
          path="/posts"
          element={<PostList />}
        />
         <Route
          path="/profile"
          element={<UserProfile />}
        />
        <Route
          path="/create-post"
          element={<CreatePost />}
        />
      </Routes>
    </>
  );
}

export default App;
