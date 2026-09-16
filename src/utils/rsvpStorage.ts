import { supabase } from "../lib/supabase";

export interface RSVPEntry {
  id: string;
  name: string;
  guests: number;
  message: string;
  timestamp: string;
}

export async function getRSVPs(): Promise<RSVPEntry[]> {
  const { data, error } = await supabase
    .from("rsvps")
    .select("id, name, guests, message, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load RSVPs:", error);
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: row.name,
    guests: Number(row.guests) || 1,
    message: row.message ?? "",
    timestamp: row.created_at,
  }));
}

export async function saveRSVP(
  name: string,
  guests: number,
  message: string = ""
): Promise<RSVPEntry> {
  const cleanName = name.trim();
  const cleanGuests = Math.max(1, guests);
  const cleanMessage = message.trim();

  const { error } = await supabase
    .from("rsvps")
    .insert({
      name: cleanName,
      guests: cleanGuests,
      message: cleanMessage,
    });

  if (error) {
    console.error("Failed to save RSVP:", error);
    throw error;
  }

  return {
    id: `rsvp-${Date.now()}`,
    name: cleanName,
    guests: cleanGuests,
    message: cleanMessage,
    timestamp: new Date().toISOString(),
  };
}

export async function deleteRSVP(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete RSVP:", error);
    return false;
  }

  return true;
}

export async function getRSVPSummary() {
  const rsvps = await getRSVPs();

  const totalSubmissions = rsvps.length;

  const totalGuestsCount = rsvps.reduce(
    (sum, item) => sum + (Number(item.guests) || 1),
    0
  );

  const totalWithWishes = rsvps.filter(
    (item) => item.message.trim().length > 0
  ).length;

  return {
    totalSubmissions,
    totalGuestsCount,
    totalWithWishes,
    rsvps,
  };
}

export async function exportRSVPsToCSV(): Promise<void> {
  const rsvps = await getRSVPs();

  const headers = [
    "الاسم",
    "عدد الحضور",
    "رسالة التهنئة",
    "تاريخ التأكيد",
  ];

  const rows = rsvps.map((entry) => [
    `"${entry.name.replace(/"/g, '""')}"`,
    entry.guests,
    `"${(entry.message || "").replace(/"/g, '""')}"`,
    `"${new Date(entry.timestamp).toLocaleString("ar-SA")}"`,
  ]);

  const csvContent =
    "\uFEFF" +
    [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\r\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `كشف-حضور-خطوبة-أمجد-وعائشة-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}