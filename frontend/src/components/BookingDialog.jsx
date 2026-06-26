import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00",
];

// mode: "create" | "reschedule"
export default function BookingDialog({ open, mode, hospital, booking, onClose, onSubmit }) {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title = mode === "reschedule" ? "Reschedule Appointment" : "Book Appointment";
  const hospitalName = hospital?.name || booking?.hospital_name;
  const hospitalLocation = hospital?.location || booking?.hospital_location;

  useEffect(() => {
    if (!open) return;
    if (mode === "reschedule" && booking) {
      setDate(dayjs(booking.appointment_date));
      setTime(booking.appointment_time);
    } else {
      setDate(dayjs().add(1, "day"));
      setTime("");
    }
    setError("");
  }, [open, mode, booking]);

  const minDate = useMemo(() => dayjs(), []);

  const handleSubmit = async () => {
    setError("");
    if (!date || !date.isValid()) {
      setError("Please choose a valid appointment date.");
      return;
    }
    if (!time) {
      setError("Please choose an appointment time.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        appointment_date: date.format("YYYY-MM-DD"),
        appointment_time: time,
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {hospitalName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hospitalLocation}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <DatePicker
            label="Appointment date"
            value={date}
            minDate={minDate}
            onChange={(v) => setDate(v)}
            slotProps={{ textField: { fullWidth: true } }}
          />
          <TextField
            select
            label="Appointment time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            fullWidth
          >
            {TIME_SLOTS.map((slot) => (
              <MenuItem key={slot} value={slot}>
                {slot}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {mode === "reschedule" ? "Save Changes" : "Confirm Booking"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
