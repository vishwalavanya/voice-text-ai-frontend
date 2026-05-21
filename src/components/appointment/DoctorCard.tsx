import { BadgeCheck, UserRoundSearch } from "lucide-react";
import type { Appointment } from "../../store/appointmentStore";

interface DoctorCardProps {
  activeAppointment?: Appointment;
}

const DoctorCard = ({ activeAppointment }: DoctorCardProps) => {
  const doctor = activeAppointment?.doctorName ?? "Doctor not assigned";
  const reason = activeAppointment?.reason ?? "Waiting for patient request";
  const language = activeAppointment?.language ?? "English";

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserRoundSearch className="h-4 w-4 text-cyan-200" />
        <p className="title-font text-sm font-semibold text-blue-100">Doctor Context</p>
      </div>

      <div className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-3">
        <p className="title-font text-base font-semibold text-blue-50">{doctor}</p>
        <p className="mt-1 text-xs text-blue-100/70">{reason}</p>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs">
        <span className="inline-flex items-center gap-1 text-cyan-100/90">
          <BadgeCheck className="h-3.5 w-3.5" />
          Preferred Language
        </span>
        <span className="text-cyan-50">{language}</span>
      </div>
    </div>
  );
};

export default DoctorCard;
