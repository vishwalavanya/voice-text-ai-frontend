import { CalendarCheck2 } from "lucide-react";
import type { Appointment } from "../../store/appointmentStore";

interface BookingStatusProps {
  appointments: Appointment[];
}

const BookingStatus = ({ appointments }: BookingStatusProps) => {
  const stats = appointments.reduce(
    (acc, appointment) => {
      acc[appointment.status] += 1;
      return acc;
    },
    { booked: 0, pending: 0, cancelled: 0, rescheduled: 0 }
  );

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarCheck2 className="h-4 w-4 text-emerald-200" />
        <p className="title-font text-sm font-semibold text-blue-100">Booking Status</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-2">
          <p className="text-emerald-100/70">Booked</p>
          <p className="title-font mt-1 text-lg text-emerald-50">{stats.booked}</p>
        </div>
        <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-2">
          <p className="text-amber-100/70">Pending</p>
          <p className="title-font mt-1 text-lg text-amber-50">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-2">
          <p className="text-blue-100/70">Rescheduled</p>
          <p className="title-font mt-1 text-lg text-blue-50">{stats.rescheduled}</p>
        </div>
        <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-2">
          <p className="text-rose-100/70">Cancelled</p>
          <p className="title-font mt-1 text-lg text-rose-50">{stats.cancelled}</p>
        </div>
      </div>
    </div>
  );
};

export default BookingStatus;
