import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";

export default function HospitalCard({ hospital, disabled, onBook }) {
  const [imgError, setImgError] = useState(false);
  const soldOut = hospital.available_slots <= 0;

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          {imgError ? (
            <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: "primary.light" }}>
              <LocalHospitalRoundedIcon />
            </Avatar>
          ) : (
            <Box
              component="img"
              src={hospital.logo_url}
              alt={`${hospital.name} logo`}
              onError={() => setImgError(true)}
              sx={{
                width: 56,
                height: 56,
                objectFit: "contain",
                borderRadius: 1.5,
                border: "1px solid #E6EAF0",
                p: 0.5,
                bgcolor: "#fff",
              }}
            />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {hospital.name}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
              <PlaceRoundedIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {hospital.location}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {hospital.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {hospital.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1} alignItems="center">
          <EventAvailableRoundedIcon fontSize="small" color={soldOut ? "disabled" : "success"} />
          <Chip
            size="small"
            color={soldOut ? "default" : "success"}
            variant="outlined"
            label={soldOut ? "No slots available" : `${hospital.available_slots} slots available`}
          />
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={disabled || soldOut}
          onClick={() => onBook(hospital)}
        >
          Book Appointment
        </Button>
      </CardActions>
    </Card>
  );
}
