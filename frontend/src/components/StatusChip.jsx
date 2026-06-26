import { Chip } from "@mui/material";

const STATUS_COLORS = {
  Booked: "info",
  Rescheduled: "warning",
  Cancelled: "default",
  Completed: "success",
};

const HR_COLORS = {
  Synced: "success",
  Pending: "warning",
  Failed: "error",
};

export function StatusChip({ status }) {
  return <Chip size="small" label={status} color={STATUS_COLORS[status] || "default"} variant="filled" />;
}

export function HRSyncChip({ status }) {
  return (
    <Chip
      size="small"
      label={`HR: ${status}`}
      color={HR_COLORS[status] || "default"}
      variant="outlined"
    />
  );
}
