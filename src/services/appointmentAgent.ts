import { useAppointmentStore, type Appointment } from "../store/appointmentStore";
import { useSessionStore, type BookingDraft } from "../store/sessionStore";
import { useVoiceStore, type SupportedLanguage } from "../store/voiceStore";
import { audioPlaybackService } from "./audioPlayback";

type AgentLanguage = SupportedLanguage;

interface ParsedUtterance {
  language: AgentLanguage;
  wantsBook: boolean;
  wantsReschedule: boolean;
  wantsCancel: boolean;
  confirms: boolean;
  denies: boolean;
  hasNoTimePreference: boolean;
  dateText: string;
  timeText: string;
  specialization: string;
}

interface AvailabilityResult {
  available: boolean;
  preferredSlot: string;
  alternatives: string[];
}

const doctorLabels: Record<string, string> = {
  cardiologist: "Cardiologist",
  dermatologist: "Dermatologist",
  dentist: "Dentist",
  pediatrician: "Pediatrician",
  ent: "ENT Specialist",
  neurologist: "Neurologist",
  orthopedist: "Orthopedist",
  physician: "General Physician"
};

const responseText = (
  key:
    | "askDoctor"
    | "checking"
    | "foundSlot"
    | "confirmed"
    | "askReschedule"
    | "rescheduled"
    | "askCancelConfirm"
    | "cancelled"
    | "slotConflict"
    | "needBookingDetails"
    | "cancelAborted"
    | "askDate"
    | "askTime"
    | "greeting",
  language: AgentLanguage,
  values: Record<string, string> = {}
) => {
  const slot = values.slot ?? "5 PM";
  const date = values.date ?? "tomorrow";
  const doctor = values.doctor ?? "the doctor";
  const alternatives = values.alternatives ?? "6 PM or 7 PM";

  const dictionary: Record<AgentLanguage, Record<string, string>> = {
    English: {
      askDoctor: "Which doctor or specialization would you prefer?",
      checking: `Checking availability for ${date}.`,
      foundSlot: `I found an available slot at ${slot}. Shall I confirm the booking?`,
      confirmed: `Your appointment has been confirmed for ${date} at ${slot} with ${doctor}.`,
      askReschedule: "Please tell me the new preferred date and time.",
      rescheduled: "Your appointment has been successfully rescheduled.",
      askCancelConfirm: "Please confirm if you want to cancel your appointment.",
      cancelled: "Your appointment has been cancelled successfully.",
      slotConflict: `That slot is already occupied. Available alternatives are ${alternatives}.`,
      needBookingDetails: "Sure. Please tell me the preferred date and specialization.",
      cancelAborted: "Okay, I will keep your appointment active.",
      askDate: "Which date would you prefer for the appointment?",
      askTime: "Do you have a preferred time?",
      greeting: "Hello, I can help you book, reschedule, or cancel a clinic appointment."
    },
    Hindi: {
      askDoctor: "आप किस डॉक्टर या specialization को prefer करेंगे?",
      checking: `${date} के लिए availability check कर रही हूँ.`,
      foundSlot: `${slot} का slot available है. क्या booking confirm कर दूँ?`,
      confirmed: `आपका appointment ${date} को ${slot} बजे ${doctor} के साथ confirm हो गया है.`,
      askReschedule: "कृपया नया preferred date और time बताइए.",
      rescheduled: "आपका appointment successfully reschedule हो गया है.",
      askCancelConfirm: "कृपया confirm करें कि आप appointment cancel करना चाहते हैं.",
      cancelled: "आपका appointment successfully cancel हो गया है.",
      slotConflict: `यह slot already occupied है. Available alternatives ${alternatives} हैं.`,
      needBookingDetails: "ठीक है. कृपया preferred date और specialization बताइए.",
      cancelAborted: "ठीक है, आपका appointment active रहेगा.",
      askDate: "आप appointment के लिए कौन सी date prefer करेंगे?",
      askTime: "क्या आपका कोई preferred time है?",
      greeting: "नमस्ते, मैं appointment book, reschedule या cancel करने में मदद कर सकती हूँ."
    },
    Tamil: {
      askDoctor: "எந்த doctor அல்லது specialization வேண்டும்?",
      checking: `${date}க்கு availability check பண்ணுகிறேன்.`,
      foundSlot: `${slot} slot available இருக்கு. Booking confirm பண்ணலாமா?`,
      confirmed: `உங்கள் appointment ${date} ${slot}க்கு ${doctor} உடன் confirm ஆகிவிட்டது.`,
      askReschedule: "புதிய preferred date மற்றும் time சொல்லுங்கள்.",
      rescheduled: "உங்கள் appointment successfully reschedule ஆகிவிட்டது.",
      askCancelConfirm: "Appointment cancel செய்ய வேண்டுமா என்று confirm பண்ணுங்கள்.",
      cancelled: "உங்கள் appointment successfully cancel ஆகிவிட்டது.",
      slotConflict: `அந்த slot already occupied. Available alternatives ${alternatives}.`,
      needBookingDetails: "சரி. Preferred date மற்றும் specialization சொல்லுங்கள்.",
      cancelAborted: "சரி, உங்கள் appointment active ஆகவே இருக்கும்.",
      askDate: "Appointmentக்கு எந்த date prefer பண்ணுகிறீர்கள்?",
      askTime: "உங்களுக்கு preferred time ஏதாவது இருக்கிறதா?",
      greeting: "வணக்கம், appointment book, reschedule அல்லது cancel செய்ய நான் உதவுவேன்."
    }
  };

  return dictionary[language][key];
};

const detectLanguage = (text: string, fallback: AgentLanguage): AgentLanguage => {
  if (/[\u0900-\u097F]/.test(text)) return "Hindi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "Tamil";
  return fallback;
};

const includesAny = (text: string, tokens: string[]) => tokens.some((token) => text.includes(token));

const parseSpecialization = (text: string) => {
  const lower = text.toLowerCase();
  if (includesAny(lower, ["cardiologist", "heart", "cardio", "हृदय", "दिल", "இதய"])) {
    return doctorLabels.cardiologist;
  }
  if (includesAny(lower, ["dermatologist", "skin", "त्वचा", "தோல்"])) {
    return doctorLabels.dermatologist;
  }
  if (includesAny(lower, ["dentist", "dental", "tooth", "दांत", "பல்"])) {
    return doctorLabels.dentist;
  }
  if (includesAny(lower, ["pediatrician", "child", "kids", "बच्च", "குழந்தை"])) {
    return doctorLabels.pediatrician;
  }
  if (includesAny(lower, ["ent", "ear", "nose", "throat"])) {
    return doctorLabels.ent;
  }
  if (includesAny(lower, ["neurologist", "neuro", "brain"])) {
    return doctorLabels.neurologist;
  }
  if (includesAny(lower, ["orthopedic", "orthopedist", "bone"])) {
    return doctorLabels.orthopedist;
  }
  if (includesAny(lower, ["physician", "general"])) {
    return doctorLabels.physician;
  }
  return "";
};

const parseDateText = (text: string) => {
  const lower = text.toLowerCase();
  if (includesAny(lower, ["tomorrow", "कल", "நாளைக்கு"])) return "tomorrow";
  if (includesAny(lower, ["today", "आज", "இன்று"])) return "today";
  const weekday = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekday) return weekday[1];
  if (lower.includes("friday") || lower.includes("शुक्र") || lower.includes("வெள்ளி")) {
    return "Friday";
  }
  return "";
};

const parseTimeText = (text: string) => {
  const lower = text.toLowerCase();
  const exact = lower.match(/\b(1[0-2]|0?[1-9])\s*(am|pm)\b/);
  if (exact) return `${Number(exact[1])} ${exact[2].toUpperCase()}`;
  if (includesAny(lower, ["morning", "सुबह", "காலை"])) return "morning";
  if (includesAny(lower, ["afternoon", "दोपहर", "மதியம்"])) return "afternoon";
  if (includesAny(lower, ["evening", "शाम", "மாலை"])) return "evening";
  return "";
};

const parseUtterance = (text: string, fallbackLanguage: AgentLanguage): ParsedUtterance => {
  const lower = text.toLowerCase();
  const language = detectLanguage(text, fallbackLanguage);

  return {
    language,
    wantsBook: includesAny(lower, [
      "book",
      "appointment",
      "schedule",
      "अपॉइंटमेंट",
      "बुक",
      "appointment book",
      "புக்",
      "book பண்ண"
    ]),
    wantsReschedule: includesAny(lower, [
      "reschedule",
      "change",
      "postpone",
      "रीशेड्यूल",
      "बदल",
      "மாற்ற",
      "reschedule பண்ண"
    ]),
    wantsCancel: includesAny(lower, ["cancel", "रद्द", "கேன்சல்", "cancel பண்ண", "ரத்து"]),
    confirms: /\b(yes|yeah|yep|confirm|ok|okay|sure)\b/.test(lower) ||
      includesAny(lower, ["हाँ", "हां", "जी", "ஆம்", "சரி"]),
    denies: /\b(no|nope|not now)\b/.test(lower) || includesAny(lower, ["नहीं", "வேண்டாம்"]),
    hasNoTimePreference:
      /\b(any time|anytime|no preference|no preferred time|no specific time)\b/.test(lower) ||
      includesAny(lower, ["कोई भी समय", "எந்த நேரமும்"]),
    dateText: parseDateText(text),
    timeText: parseTimeText(text),
    specialization: parseSpecialization(text)
  };
};

const dateFromDraft = (dateText: string, timeText: string) => {
  const date = new Date();
  const normalizedDate = dateText.toLowerCase();
  if (normalizedDate === "tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (normalizedDate && normalizedDate !== "today") {
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = weekdays.indexOf(normalizedDate.toLowerCase());
    if (targetDay >= 0) {
      const diff = (targetDay - date.getDay() + 7) % 7 || 7;
      date.setDate(date.getDate() + diff);
    }
  }

  const timeMatch = timeText.match(/(\d+)\s*(AM|PM)/i);
  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const period = timeMatch[2].toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    date.setHours(hours, 0, 0, 0);
  }

  return date.toISOString();
};

const slotForPreference = (timeText: string) => {
  const normalized = timeText.toLowerCase();
  if (!normalized || normalized === "any time") return "5 PM";
  if (normalized === "morning") return "10 AM";
  if (normalized === "afternoon") return "2 PM";
  if (normalized === "evening") return "5 PM";
  return timeText;
};

const describeRedisSession = (draft: BookingDraft) =>
  JSON.stringify({
    intent: draft.action === "book" ? "book_appointment" : draft.action,
    doctor_specialization: draft.specialization || null,
    preferred_date: draft.dateText || null,
    preferred_time: draft.timeText || null,
    awaiting_field: draft.awaitingField
  });

const emitAssistant = (text: string, language: AgentLanguage) => {
  const voiceStore = useVoiceStore.getState();
  voiceStore.setVoicePhase("speaking");
  voiceStore.setCurrentAIResponse(text);
  voiceStore.addMessage({ role: "assistant", text, language });
  audioPlaybackService.speakText(text, language);
};

const updateLanguage = (language: AgentLanguage) => {
  useVoiceStore.getState().setLanguage(language);
  useSessionStore.getState().setPreferredLanguage(language);
};

const setDraft = (draft: Partial<BookingDraft>) => {
  useSessionStore.getState().setBookingDraft(draft);
};

export const checkAvailability = (draft: BookingDraft): AvailabilityResult => {
  const requestedSlot = slotForPreference(draft.timeText);
  const explicitFivePm = draft.timeText.toLowerCase() === "5 pm";

  if (explicitFivePm) {
    return {
      available: false,
      preferredSlot: requestedSlot,
      alternatives: ["6 PM", "7 PM"]
    };
  }

  return {
    available: true,
    preferredSlot: requestedSlot,
    alternatives: []
  };
};

export const bookAppointment = (draft: BookingDraft, language: AgentLanguage): Appointment => {
  const appointment: Appointment = {
    id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
    patientName: "Voice Session Patient",
    doctorName: draft.specialization || "General Physician",
    dateTime: dateFromDraft(
      draft.dateText || "tomorrow",
      draft.confirmationSlot || slotForPreference(draft.timeText)
    ),
    reason: "Voice booking request",
    language,
    status: "booked",
    notes: `Booked by conversational receptionist. Date: ${draft.dateText || "tomorrow"}`
  };

  useAppointmentStore.getState().upsertAppointment(appointment);
  return appointment;
};

export const cancelAppointment = () => {
  const appointmentStore = useAppointmentStore.getState();
  const active =
    appointmentStore.appointments.find((item) => item.id === appointmentStore.activeAppointmentId) ??
    appointmentStore.appointments[0];

  if (!active) return null;

  appointmentStore.upsertAppointment({
    ...active,
    status: "cancelled",
    notes: "Cancelled by conversational receptionist."
  });
  return active.id;
};

export const rescheduleAppointment = (draft: BookingDraft) => {
  const appointmentStore = useAppointmentStore.getState();
  const active =
    appointmentStore.appointments.find((item) => item.id === appointmentStore.activeAppointmentId) ??
    appointmentStore.appointments[0];

  if (!active) return null;

  appointmentStore.upsertAppointment({
    ...active,
    dateTime: dateFromDraft(draft.dateText || "Friday", draft.timeText || "10 AM"),
    status: "rescheduled",
    notes: `Rescheduled by conversational receptionist to ${draft.dateText} ${draft.timeText}.`
  });
  return active.id;
};

export const runReceptionistTurn = async (text: string, fallbackLanguage: AgentLanguage) => {
  const parsed = parseUtterance(text, fallbackLanguage);
  const session = useSessionStore.getState();
  const draft = session.bookingDraft;
  const startedAt = performance.now();

  updateLanguage(parsed.language);

  const mergedDraft: BookingDraft = {
    ...draft,
    dateText: parsed.dateText || draft.dateText,
    timeText: parsed.hasNoTimePreference ? "any time" : parsed.timeText || draft.timeText,
    specialization: parsed.specialization || draft.specialization
  };
  let activeBookingDraft: BookingDraft | null = null;

  if (parsed.wantsCancel && draft.action !== "cancel") {
    session.clearBookingDraft();
    setDraft({ action: "cancel", awaitingField: "confirmation" });
    session.setCurrentIntent("Cancel appointment");
    session.setCurrentBookingState("Awaiting cancellation confirmation");
    session.setToolTrace("intent_detection()", "cancel_appointment pending confirmation");
    session.addMemoryLine("Cancel intent detected. Pending booking state cleared.");
    emitAssistant(responseText("askCancelConfirm", parsed.language), parsed.language);
    return;
  }

  if (draft.action === "cancel") {
    if (parsed.confirms) {
      const appointmentId = cancelAppointment();
      session.setCurrentBookingState("Cancelled");
      session.setToolTrace("cancel_appointment()", appointmentId ?? "No active appointment found");
      session.addMemoryLine(`cancel_appointment() completed for ${appointmentId ?? "unknown appointment"}.`);
      session.clearBookingDraft();
      emitAssistant(responseText("cancelled", parsed.language), parsed.language);
      return;
    }

    if (parsed.denies) {
      session.setCurrentBookingState("Cancellation aborted");
      session.clearBookingDraft();
      emitAssistant(responseText("cancelAborted", parsed.language), parsed.language);
      return;
    }
  }

  if (parsed.wantsReschedule && draft.action !== "reschedule") {
    session.clearBookingDraft();
    setDraft({
      action: "reschedule",
      dateText: parsed.dateText,
      timeText: parsed.timeText,
      awaitingField: parsed.dateText || parsed.timeText ? null : "preferred_date"
    });
    session.setCurrentIntent("Reschedule appointment");
    session.setCurrentBookingState("Awaiting new date and time");
    session.setToolTrace("intent_detection()", "reschedule_appointment awaiting date/time");
    session.addMemoryLine("Reschedule intent detected. Pending booking state cleared.");

    if (!parsed.dateText && !parsed.timeText) {
      emitAssistant(responseText("askReschedule", parsed.language), parsed.language);
      return;
    }
  }

  if (draft.action === "reschedule" || parsed.wantsReschedule) {
    if (!mergedDraft.dateText && !mergedDraft.timeText) {
      emitAssistant(responseText("askReschedule", parsed.language), parsed.language);
      return;
    }

    setDraft({ ...mergedDraft, action: "reschedule" });
    const appointmentId = rescheduleAppointment({ ...mergedDraft, action: "reschedule" });
    session.setCurrentBookingState("Rescheduled");
    session.setToolTrace("reschedule_appointment()", appointmentId ?? "No active appointment found");
    session.addMemoryLine(`reschedule_appointment() completed for ${mergedDraft.dateText} ${mergedDraft.timeText}.`);
    session.clearBookingDraft();
    emitAssistant(responseText("rescheduled", parsed.language), parsed.language);
    return;
  }

  if (parsed.wantsBook && draft.action !== "book") {
    const freshBookingDraft: BookingDraft = {
      action: "book",
      dateText: parsed.dateText,
      timeText: parsed.hasNoTimePreference ? "any time" : parsed.timeText,
      specialization: parsed.specialization,
      confirmationSlot: "",
      appointmentId: null,
      awaitingField: parsed.specialization ? "preferred_time" : "doctor_specialization"
    };

    session.clearBookingDraft();
    setDraft(freshBookingDraft);
    activeBookingDraft = freshBookingDraft;
    session.setCurrentIntent("Book appointment");
    session.setSelectedDoctor(freshBookingDraft.specialization || "Not selected");
    session.setCurrentBookingState("Collecting doctor or specialization");
    session.setToolTrace("intent_detection()", `booking intent, date=${freshBookingDraft.dateText || "missing"}`);
    session.addMemoryLine(`Redis session: ${describeRedisSession(freshBookingDraft)}`);

    if (!freshBookingDraft.specialization) {
      emitAssistant(responseText("askDoctor", parsed.language), parsed.language);
      return;
    }
  }

  const isProvidingDoctor = Boolean(parsed.specialization) && draft.action === "book";
  if (draft.action === "book" || parsed.wantsBook || isProvidingDoctor) {
    const nextDraft = activeBookingDraft ?? { ...mergedDraft, action: "book" as const };
    session.setCurrentIntent("Book appointment");
    session.setSelectedDoctor(nextDraft.specialization || "Not selected");

    if (!nextDraft.specialization) {
      const pendingDraft = { ...nextDraft, awaitingField: "doctor_specialization" as const };
      setDraft(pendingDraft);
      session.setCurrentBookingState("Awaiting doctor specialization");
      session.setToolTrace("redis_session", describeRedisSession(pendingDraft));
      session.addMemoryLine(`Redis session: ${describeRedisSession(pendingDraft)}`);
      emitAssistant(responseText("askDoctor", parsed.language), parsed.language);
      return;
    }

    if (!nextDraft.dateText) {
      const pendingDraft = { ...nextDraft, awaitingField: "preferred_date" as const };
      setDraft(pendingDraft);
      session.setCurrentBookingState("Need appointment date");
      session.setToolTrace("redis_session", describeRedisSession(pendingDraft));
      session.addMemoryLine(`Redis session: ${describeRedisSession(pendingDraft)}`);
      emitAssistant(responseText("askDate", parsed.language), parsed.language);
      return;
    }

    if (!nextDraft.timeText) {
      const pendingDraft = { ...nextDraft, awaitingField: "preferred_time" as const };
      setDraft(pendingDraft);
      session.setCurrentBookingState("Awaiting preferred time");
      session.setToolTrace("redis_session", describeRedisSession(pendingDraft));
      session.addMemoryLine(`Redis session: ${describeRedisSession(pendingDraft)}`);
      emitAssistant(responseText("askTime", parsed.language), parsed.language);
      return;
    }

    if (!nextDraft.confirmationSlot) {
      const checkingDraft = { ...nextDraft, awaitingField: null };
      setDraft(checkingDraft);
      session.setCurrentBookingState("Checking availability");
      session.setToolTrace(
        "check_availability()",
        `date=${nextDraft.dateText}, time=${nextDraft.timeText}, doctor=${nextDraft.specialization}`
      );
      session.addMemoryLine(`Redis session complete. Calling check_availability(): ${describeRedisSession(checkingDraft)}`);
      emitAssistant(
        responseText("checking", parsed.language, {
          date: `${nextDraft.dateText} ${nextDraft.timeText}`.trim()
        }),
        parsed.language
      );

      await new Promise((resolve) => window.setTimeout(resolve, 500));

      const availability = checkAvailability(checkingDraft);
      const llmLatency = performance.now() - startedAt;
      useVoiceStore.getState().setLatency({
        llm: Math.round(llmLatency),
        total: Math.round(llmLatency + 180)
      });

      if (!availability.available) {
        session.setCurrentBookingState("Slot conflict");
        session.setToolTrace(
          "check_availability()",
          `unavailable, alternatives=${availability.alternatives.join(", ")}`
        );
        session.addMemoryLine(`Slot conflict found. Alternatives: ${availability.alternatives.join(", ")}.`);
        setDraft({ ...nextDraft, timeText: "", confirmationSlot: "", awaitingField: "preferred_time" });
        emitAssistant(
          responseText("slotConflict", parsed.language, {
            alternatives: availability.alternatives.join(" or ")
          }),
          parsed.language
        );
        return;
      }

      setDraft({
        ...nextDraft,
        confirmationSlot: availability.preferredSlot,
        awaitingField: "confirmation"
      });
      session.setCurrentBookingState("Awaiting booking confirmation");
      session.setToolTrace("check_availability()", `available=${availability.preferredSlot}`);
      session.addMemoryLine(`Available slot held: ${availability.preferredSlot}.`);
      emitAssistant(responseText("foundSlot", parsed.language, { slot: availability.preferredSlot }), parsed.language);
      return;
    }

    if (parsed.confirms) {
      const appointment = bookAppointment(nextDraft, parsed.language);
      session.setCurrentBookingState("Confirmed");
      session.setSelectedDoctor(appointment.doctorName);
      session.setToolTrace("book_appointment()", appointment.id);
      session.addMemoryLine(`book_appointment() confirmed ${appointment.id}.`);
      session.clearBookingDraft();
      emitAssistant(
        responseText("confirmed", parsed.language, {
          date: nextDraft.dateText,
          slot: nextDraft.confirmationSlot,
          doctor: nextDraft.specialization
        }),
        parsed.language
      );
      return;
    }

    session.setCurrentBookingState("Awaiting booking confirmation");
    setDraft({ ...nextDraft, awaitingField: "confirmation" });
    emitAssistant(
      responseText("foundSlot", parsed.language, { slot: nextDraft.confirmationSlot }),
      parsed.language
    );
    return;
  }

  if (includesAny(text.toLowerCase(), ["hi", "hello", "hey", "how are you", "नमस्ते", "வணக்கம்"])) {
    if (draft.action) {
      session.clearBookingDraft();
      session.addMemoryLine("Topic changed. Pending appointment state cleared.");
    }
    session.setCurrentIntent("General greeting");
    session.setCurrentBookingState("Ready for appointment request");
    session.setToolTrace("conversation()", "greeting handled");
    emitAssistant(responseText("greeting", parsed.language), parsed.language);
  }
};

export const shouldRunReceptionistFallback = () => {
  return import.meta.env.VITE_ENABLE_RECEPTIONIST_FALLBACK !== "false";
};
