import { styled } from '@mui/material/styles';
import { Box, Container, Button } from '@mui/material';

export const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  padding: "0 16px", // Padding for mobile

  [theme.breakpoints.down("sm")]: {
    padding: "0 8px", // Smaller padding on very small devices
  },
}));

export const StyledBox = styled(Box)(({ theme }) => ({
  boxShadow: theme.shadows[3],
  padding: 32,
  borderRadius: 8,
  backgroundColor: "white",
  width: "100%",
  maxWidth: 400,

  [theme.breakpoints.down("sm")]: {
    padding: 24, // Less padding for small screens
  },
  [theme.breakpoints.up("md")]: {
    maxWidth: 600, // Wider form on tablets
  },
}));

export const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: 16,
}));