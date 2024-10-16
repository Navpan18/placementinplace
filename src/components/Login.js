import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { TextField, Typography, Alert } from "@mui/material";
import { StyledContainer, StyledBox, StyledButton } from "./LoginStyle"; // Import styled components

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to log in: " + err.message);
    }
  };

  return (
    <StyledContainer maxWidth="sm">
      <StyledBox>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Login
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <StyledButton type="submit" fullWidth variant="contained" color="primary">
            Log In
          </StyledButton>
        </form>
      </StyledBox>
    </StyledContainer>
  );
};

export default Login;