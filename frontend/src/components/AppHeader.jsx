import { AppBar, Avatar, Box, Chip, IconButton, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../auth/AuthContext";

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AppHeader() {
  const { employee, logout } = useAuth();

  return (
    <AppBar position="sticky" color="default" sx={{ bgcolor: "#fff" }}>
      <Toolbar sx={{ gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LocalHospitalRoundedIcon sx={{ color: "#fff" }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap sx={{ lineHeight: 1.1 }}>
            AHC Employee Dashboard
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Annual Health Checkup booking portal
          </Typography>
        </Box>

        {employee && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {employee.name}
              </Typography>
              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                <Chip size="small" label={employee.employee_id} variant="outlined" />
                <Chip size="small" label={employee.department} color="secondary" variant="outlined" />
              </Stack>
            </Box>
            <Avatar sx={{ bgcolor: "secondary.main" }}>{initials(employee.name)}</Avatar>
            <Tooltip title="Sign out">
              <IconButton onClick={logout} color="inherit">
                <LogoutRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
