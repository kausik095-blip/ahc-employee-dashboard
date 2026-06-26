import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AppHeader from "../components/AppHeader";
import HospitalCard from "../components/HospitalCard";
import BookingDialog from "../components/BookingDialog";
import BookingsTable from "../components/BookingsTable";
import { bookingApi, hospitalApi } from "../api/endpoints";
import { extractError } from "../api/client";

const ACTIVE = new Set(["Booked", "Rescheduled"]);

function StatCard({ label, value, color }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" color={color || "text.primary"}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [hospitals, setHospitals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [dialog, setDialog] = useState({ open: false, mode: "create", hospital: null, booking: null });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const notify = (message, severity = "success") => setToast({ message, severity });

  const load = useCallback(async () => {
    setError("");
    try {
      const [h, b] = await Promise.all([hospitalApi.list(), bookingApi.list()]);
      setHospitals(h);
      setBookings(b);
    } catch (err) {
      setError(extractError(err, "Failed to load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeBooking = useMemo(() => bookings.find((b) => ACTIVE.has(b.status)) || null, [bookings]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      active: bookings.filter((b) => ACTIVE.has(b.status)).length,
      completed: bookings.filter((b) => b.status === "Completed").length,
    };
  }, [bookings]);

  const openCreate = (hospital) => setDialog({ open: true, mode: "create", hospital, booking: null });
  const openReschedule = (booking) =>
    setDialog({ open: true, mode: "reschedule", hospital: null, booking });
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const handleDialogSubmit = async (payload) => {
    try {
      if (dialog.mode === "reschedule") {
        await bookingApi.reschedule(dialog.booking.id, payload);
        notify("Appointment rescheduled and HR portal updated.");
      } else {
        await bookingApi.create({ hospital_id: dialog.hospital.id, ...payload });
        notify("Appointment booked and HR portal updated.");
      }
    } catch (err) {
      // Re-throw a clean message so the dialog can display it inline.
      throw new Error(extractError(err));
    }
    closeDialog();
    await load();
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingApi.cancel(cancelTarget.id);
      notify("Appointment cancelled and HR portal updated.", "info");
      setCancelTarget(null);
      await load();
    } catch (err) {
      notify(extractError(err), "error");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppHeader />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={4}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <StatCard label="Total Appointments" value={stats.total} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard label="Active" value={stats.active} color="info.main" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard label="Completed" value={stats.completed} color="success.main" />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="h5" gutterBottom>
                Partner Hospitals
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activeBooking
                  ? "You have an active appointment. Reschedule or cancel it below to book a different hospital."
                  : "Choose a hospital to book your Annual Health Checkup."}
              </Typography>
              <Grid container spacing={3}>
                {hospitals.map((h) => (
                  <Grid item xs={12} sm={6} md={4} key={h.id}>
                    <HospitalCard hospital={h} disabled={!!activeBooking} onBook={openCreate} />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5">Booking History & Status</Typography>
                <Button startIcon={<RefreshRoundedIcon />} onClick={load} size="small">
                  Refresh
                </Button>
              </Stack>
              <Card>
                <CardContent>
                  <BookingsTable
                    bookings={bookings}
                    onReschedule={openReschedule}
                    onCancel={(b) => setCancelTarget(b)}
                  />
                </CardContent>
              </Card>
            </Box>
          </Stack>
        )}
      </Container>

      <BookingDialog
        open={dialog.open}
        mode={dialog.mode}
        hospital={dialog.hospital}
        booking={dialog.booking}
        onClose={closeDialog}
        onSubmit={handleDialogSubmit}
      />

      <Dialog open={!!cancelTarget} onClose={cancelling ? undefined : () => setCancelTarget(null)}>
        <DialogTitle>Cancel appointment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will cancel your appointment at {cancelTarget?.hospital_name} on{" "}
            {cancelTarget?.appointment_date} at {cancelTarget?.appointment_time}. The HR portal will be
            updated automatically.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelTarget(null)} disabled={cancelling}>
            Keep Appointment
          </Button>
          <Button color="error" variant="contained" onClick={confirmCancel} disabled={cancelling}>
            Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)} variant="filled">
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
