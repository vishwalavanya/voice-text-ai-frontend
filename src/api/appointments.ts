import { API_BASE_URL } from "./config";
import type { Appointment } from "../store/appointmentStore";

const normalizeAppointment = (item: Partial<Appointment>, index: number): Appointment => ({
  id: item.id ?? `APT-${1000 + index}`,
  patientName: item.patientName ?? "Unknown Patient",
  doctorName: item.doctorName ?? "Doctor not set",
  dateTime: item.dateTime ?? new Date().toISOString(),
  reason: item.reason ?? "Consultation",
  language: item.language ?? "English",
  status: item.status ?? "pending",
  notes: item.notes
});

export const fetchAppointments = async (): Promise<Appointment[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch appointments (${response.status})`);
    }

    const payload = await response.json();
    const list = Array.isArray(payload) ? payload : payload.appointments;

    if (!Array.isArray(list)) {
      return [];
    }

    return list.map((item: Partial<Appointment>, index: number) =>
      normalizeAppointment(item, index)
    );
  } catch {
    return [];
  }
};

export const submitAppointment = async (
  appointment: Appointment
): Promise<{ ok: boolean; data?: Appointment }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointment)
    });

    if (!response.ok) {
      return { ok: false };
    }

    const payload = (await response.json()) as Partial<Appointment>;
    return { ok: true, data: normalizeAppointment(payload, 0) };
  } catch {
    return { ok: false };
  }
};
