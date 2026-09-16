import { supabase } from "../lib/supabase";

export interface GuestMessage {
  id: string;
  name: string;
  message: string;
  timestamp: string;
}

export async function saveMessage(
  name: string,
  message: string
): Promise<GuestMessage> {
  const cleanName = name.trim();
  const cleanMessage = message.trim();

  const { error } = await supabase
    .from("guestbook_messages")
    .insert({
      name: cleanName,
      message: cleanMessage,
    });

  if (error) {
    console.error("Failed to save guestbook message:", error);
    throw error;
  }

  return {
    id: `msg-${Date.now()}`,
    name: cleanName,
    message: cleanMessage,
    timestamp: new Date().toISOString(),
  };
}

export async function getMessages(): Promise<GuestMessage[]> {
  const { data, error } = await supabase
    .from("guestbook_messages")
    .select("id, name, message, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load guestbook messages:", error);
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: row.name,
    message: row.message,
    timestamp: row.created_at,
  }));
}

export function formatArabicDate(isoString: string): string {
  const date = new Date(isoString);

  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "مساءً" : "صباحاً";
  const displayHour = hours % 12 || 12;

  return `${day} ${month} ${year} — ${displayHour}:${minutes} ${period}`;
}