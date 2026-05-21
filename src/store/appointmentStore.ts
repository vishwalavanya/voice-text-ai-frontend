import { create } from "zustand";

export type AppointmentStatus = "booked" | "cancelled" | "rescheduled" | "pending";

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  dateTime: string;
  reason: string;
  language: string;
  status: AppointmentStatus;
  notes?: string;
}

interface AppointmentStore {
  appointments: Appointment[];
  activeAppointmentId: string | null;
  lastUpdatedAt: string | null;
  setAppointments: (appointments: Appointment[]) => void;
  upsertAppointment: (appointment: Appointment) => void;
  setActiveAppointmentId: (id: string | null) => void;
}

const starterAppointments: Appointment[] = [
  {
    id: "APT-1001",
    patientName: "Ritika Sharma",
    doctorName: "Dr. A. Mehta",
    dateTime: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    reason: "ENT follow-up",
    language: "Hindi",
    status: "pending"
  },
  {
    id: "APT-1002",
    patientName: "Karan Iyer",
    doctorName: "Dr. V. Nair",
    dateTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    reason: "General physician consultation",
    language: "English",
    status: "booked"
  }
];

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  appointments: starterAppointments,
  activeAppointmentId: starterAppointments[0]?.id ?? null,
  lastUpdatedAt: new Date().toISOString(),
  setAppointments: (appointments) =>
    set({
      appointments,
      lastUpdatedAt: new Date().toISOString()
    }),
  upsertAppointment: (appointment) =>
    set((state) => {
      const index = state.appointments.findIndex((item) => item.id === appointment.id);
      if (index === -1) {
        return {
          appointments: [appointment, ...state.appointments],
          activeAppointmentId: appointment.id,
          lastUpdatedAt: new Date().toISOString()
        };
      }

      const nextAppointments = [...state.appointments];
      nextAppointments[index] = appointment;
      return {
        appointments: nextAppointments,
        activeAppointmentId: appointment.id,
        lastUpdatedAt: new Date().toISOString()
      };
    }),
  setActiveAppointmentId: (activeAppointmentId) => set({ activeAppointmentId })
}));
