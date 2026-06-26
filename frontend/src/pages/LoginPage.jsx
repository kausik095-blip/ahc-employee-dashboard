import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import { useAuth } from "../auth/AuthContext";
import { extractError } from "../api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setError(extractError(err, "Login failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const useDemo = () => {
    setIdentifier("AHC1001");
    setPassword("Password@123");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0B5394 0%, #0FA3A3 100%)",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 440 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LocalHospitalRoundedIcon sx={{ color: "#fff", fontSize: 32 }} />
            </Box>
            <Typography variant="h5">AHC Employee Dashboard</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Annual Health Checkup booking portal
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Company Email or Employee ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                fullWidth
                required
                autoFocus
                placeholder="aarthi.rajan@company.com or AHC1001"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Chip label="Demo access" size="small" />
          </Divider>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Employee ID <strong>AHC1001</strong> · Password <strong>Password@123</strong>
            </Typography>
            <Button onClick={useDemo} size="small" variant="outlined">
              Use demo credentials
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
