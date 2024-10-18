// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { AuthProvider } from "./AuthContext";
import MyListings from "./components/MyListings";
import AllListings from "./components/AllListings";
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/mylistings" element={<MyListings />} />
          <Route path="/alllistings" element={<AllListings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
