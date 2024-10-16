import { styled } from '@mui/material/styles';
import { Container, Button } from '@mui/material';

export const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
}));

export const StyledForm = styled('form')(({ theme }) => ({
  width: "100%",
  maxWidth: 600,
  display: "flex",
  flexDirection: "column",
}));

export const StyledTextField = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

