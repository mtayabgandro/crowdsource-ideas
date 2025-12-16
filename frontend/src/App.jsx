import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import CreatePost from './pages/CreatePost';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/post/:id" element={<PostDetail />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
