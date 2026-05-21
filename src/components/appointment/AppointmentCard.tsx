import { CalendarDays, Clock3, Stethoscope } from "lucide-react";
import clsx from "clsx";
import type { Appointment, AppointmentStatus } from "../../store/appointmentStore";

interface AppointmentCardProps {
  appointment: Appointment;
  active?: boolean;
  onClick?: () => void;
}

const statusTheme: Record<
  AppointmentStatus,
  { badge: string; ring: string; panel: string; label: string }
> = {
  booked: {
    badge: "bg-emerald-400/20 text-emerald-100 border-emerald-300/40",
    ring: "ring-emerald-300/20",
    panel: "from-emerald-400/10 to-cyan-400/5",
    label: "Booked"
  },
  pending: {
    badge: "bg-amber-400/20 text-amber-100 border-amber-300/40",
    ring: "ring-amber-300/20",
    panel: "from-amber-400/10 to-blue-400/5",
    label: "Pending"
  },
  cancelled: {
    badge: "bg-rose-400/20 text-rose-100 border-rose-300/40",
    ring: "ring-rose-300/20",
    panel: "from-rose-400/10 to-blue-400/5",
    label: "Cancelled"
  },
  rescheduled: {
    badge: "bg-blue-400/20 text-blue-100 border-blue-300/40",
    ring: "ring-blue-300/20",
    panel: "from-blue-400/10 to-cyan-400/5",
    label: "Rescheduled"
  }
};

const AppointmentCard = ({ appointment, active, onClick }: AppointmentCardProps) => {
  const theme = statusTheme[appointment.status];
  const appointmentDate = new Date(appointment.dateTime);

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full rounded-2xl border bg-gradient-to-br p-3 text-left transition-all duration-300",
        "ring-1 ring-transparent hover:-translate-y-0.5",
        theme.panel,
        theme.ring,
        active
          ? "border-cyan-300/55 shadow-[0_0_24px_rgba(18,214,223,0.2)]"
          : "border-blue-300/20 hover:border-blue-300/45"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="title-font text-sm font-semibold text-blue-50">{appointment.patientName}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${theme.badge}`}>
          {theme.label}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-blue-100/80">
        <p className="inline-flex items-center gap-1.5">
          <Stethoscope className="h-3.5 w-3.5 text-cyan-200" />
          {appointment.doctorName}
        </p>
        <p className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-cyan-200" />
          {appointmentDate.toLocaleDateString()}
        </p>
        <p className="inline-flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 text-cyan-200" />
          {appointmentDate.toLocaleTimeString()}
        </p>
        <p className="text-blue-100/75">{appointment.reason}</p>
      </div>
    </button>
  );
};

export default AppointmentCard;
