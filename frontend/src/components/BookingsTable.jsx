import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EditCalendarRoundedIcon from "@mui/icons-material/EditCalendarRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { HRSyncChip, StatusChip } from "./StatusChip";

const ACTIVE = new Set(["Booked", "Rescheduled"]);

function Actions({ booking, onReschedule, onCancel, size }) {
  if (!ACTIVE.has(booking.status)) {
    return (
      <Typography variant="caption" color="text.secondary">
        No actions
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={1}>
      <Button
        size={size}
        variant="outlined"
        startIcon={<EditCalendarRoundedIcon />}
        onClick={() => onReschedule(booking)}
      >
        Reschedule
      </Button>
      <Button
        size={size}
        variant="outlined"
        color="error"
        startIcon={<CancelRoundedIcon />}
        onClick={() => onCancel(booking)}
      >
        Cancel
      </Button>
    </Stack>
  );
}

export default function BookingsTable({ bookings, onReschedule, onCancel }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (bookings.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          No appointments yet. Book your Annual Health Checkup from a hospital above.
        </Typography>
      </Box>
    );
  }

  if (isMobile) {
    return (
      <Stack spacing={2}>
        {bookings.map((b) => (
          <Card key={b.id} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  {b.hospital_name}
                </Typography>
                <StatusChip status={b.status} />
              </Stack>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {b.hospital_location}
              </Typography>
              <Typography variant="body2">
                {b.appointment_date} at {b.appointment_time}
              </Typography>
              <Box sx={{ mt: 1, mb: 1.5 }}>
                <HRSyncChip status={b.hr_sync_status} />
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Actions booking={b} onReschedule={onReschedule} onCancel={onCancel} size="small" />
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Hospital</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>HR Sync</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{b.hospital_name}</TableCell>
              <TableCell>{b.hospital_location}</TableCell>
              <TableCell>{b.appointment_date}</TableCell>
              <TableCell>{b.appointment_time}</TableCell>
              <TableCell>
                <StatusChip status={b.status} />
              </TableCell>
              <TableCell>
                <HRSyncChip status={b.hr_sync_status} />
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Actions booking={b} onReschedule={onReschedule} onCancel={onCancel} size="small" />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
