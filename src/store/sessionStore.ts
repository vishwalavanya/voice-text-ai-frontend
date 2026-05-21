import { create } from "zustand";
import type { SupportedLanguage } from "./voiceStore";

export type PendingAction = "book" | "reschedule" | "cancel" | null;
export type AwaitingField =
  | "intent"
  | "doctor_specialization"
  | "preferred_date"
  | "preferred_time"
  | "confirmation"
  | null;

export interface BookingDraft {
  action: PendingAction;
  dateText: string;
  timeText: string;
  specialization: string;
  confirmationSlot: string;
  appointmentId: string | null;
  awaitingField: AwaitingField;
}

interface SessionStore {
  currentIntent: string;
  selectedDoctor: string;
  preferredLanguage: SupportedLanguage;
  currentBookingState: string;
  bookingDraft: BookingDraft;
  lastToolCall: string;
  lastToolResult: string;
  memoryLog: string[];
  updatedAt: string | null;
  setCurrentIntent: (intent: string) => void;
  setSelectedDoctor: (doctor: string) => void;
  setPreferredLanguage: (language: SupportedLanguage) => void;
  setCurrentBookingState: (state: string) => void;
  setBookingDraft: (draft: Partial<BookingDraft>) => void;
  clearBookingDraft: () => void;
  setToolTrace: (toolCall: string, toolResult: string) => void;
  addMemoryLine: (line: string) => void;
  applySessionSnapshot: (snapshot: SessionSnapshot) => void;
  resetMemory: () => void;
}

interface SessionSnapshot {
  currentIntent?: string;
  selectedDoctor?: string;
  preferredLanguage?: SupportedLanguage;
  currentBookingState?: string;
  bookingDraft?: Partial<BookingDraft>;
  lastToolCall?: string;
  lastToolResult?: string;
  memoryLog?: string[];
}

const emptyDraft: BookingDraft = {
  action: null,
  dateText: "",
  timeText: "",
  specialization: "",
  confirmationSlot: "",
  appointmentId: null,
  awaitingField: null
};

export const useSessionStore = create<SessionStore>((set) => ({
  currentIntent: "Collect appointment details",
  selectedDoctor: "Not selected",
  preferredLanguage: "English",
  currentBookingState: "Awaiting patient request",
  bookingDraft: emptyDraft,
  lastToolCall: "None",
  lastToolResult: "Waiting for patient request",
  memoryLog: [
    "Session booted and waiting for microphone activation.",
    "Voice model ready for multilingual intake."
  ],
  updatedAt: new Date().toISOString(),
  setCurrentIntent: (currentIntent) => set({ currentIntent, updatedAt: new Date().toISOString() }),
  setSelectedDoctor: (selectedDoctor) =>
    set({ selectedDoctor, updatedAt: new Date().toISOString() }),
  setPreferredLanguage: (preferredLanguage) =>
    set({ preferredLanguage, updatedAt: new Date().toISOString() }),
  setCurrentBookingState: (currentBookingState) =>
    set({ currentBookingState, updatedAt: new Date().toISOString() }),
  setBookingDraft: (draft) =>
    set((state) => ({
      bookingDraft: { ...state.bookingDraft, ...draft },
      updatedAt: new Date().toISOString()
    })),
  clearBookingDraft: () => set({ bookingDraft: emptyDraft, updatedAt: new Date().toISOString() }),
  setToolTrace: (lastToolCall, lastToolResult) =>
    set({ lastToolCall, lastToolResult, updatedAt: new Date().toISOString() }),
  addMemoryLine: (line) =>
    set((state) => ({
      memoryLog: [line, ...state.memoryLog].slice(0, 12),
      updatedAt: new Date().toISOString()
    })),
  applySessionSnapshot: (snapshot) =>
    set((state) => ({
      ...state,
      ...snapshot,
      bookingDraft: {
        ...state.bookingDraft,
        ...snapshot.bookingDraft
      },
      updatedAt: new Date().toISOString()
    })),
  resetMemory: () =>
    set({
      currentIntent: "Collect appointment details",
      selectedDoctor: "Not selected",
      preferredLanguage: "English",
      currentBookingState: "Awaiting patient request",
      bookingDraft: emptyDraft,
      lastToolCall: "None",
      lastToolResult: "Waiting for patient request",
      memoryLog: [
        "Session reset by operator.",
        "Voice model ready for multilingual intake."
      ],
      updatedAt: new Date().toISOString()
    })
}));
