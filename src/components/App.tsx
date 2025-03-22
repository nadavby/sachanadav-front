/** @format */

import { Routes, Route } from "react-router-dom";
import { Login } from "./Login";
import { RegistrationForm } from "./RegristrationForm";
import PostList from "./ListPosts";
import UserProfile from "./UserProfile";
import CreatePost from "./CreatePost";
import ListComments from "./ListComments";
import UpdatePost from "./UpdatePost";
import Chatbot from "./ChatBot";
import { useAuth } from "../hooks/useAuth";

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <PostList /> : <Login />}
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
        <Route
          path="/comments"
          element={<ListComments />}
  
        />
        <Route
          path="/update-post/:postId"
          element={<UpdatePost />}
  
        />
         <Route
          path="/chatbot"
          element={<Chatbot />}
  
        />
      </Routes>

    </>
  );
}

export default App;
