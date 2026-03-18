import { cache } from "react";
import { normalizePhoneNumber } from "@/lib/phone";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const getAttendees = cache(async () => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("attendees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
});

export async function checkInByPhoneNumber(phoneNumber: string) {
  const normalized = normalizePhoneNumber(phoneNumber);

  if (!normalized) {
    return { success: false, message: "So dien thoai khong hop le." };
  }

  const supabase = createSupabaseAdminClient();
  // Tìm kiếm bằng cách normalize cả database và input
  const { data: attendees, error } = await supabase
    .from("attendees")
    .select("*");

  if (error) {
    return { success: false, message: "Loi he thong." };
  }

  // Tìm attendee có phone_number normalize khớp
  const attendee = attendees.find(att => normalizePhoneNumber(att.phone_number) === normalized);

  if (!attendee) {
    return { success: false, message: "Khong tim thay nguoi tham gia voi so dien thoai nay." };
  }

  if (attendee.is_present) {
    return { success: false, message: "Ban da diem danh roi." };
  }

  const { error: updateError } = await supabase
    .from("attendees")
    .update({ is_present: true, checked_in_at: new Date().toISOString() })
    .eq("id", attendee.id);

  if (updateError) {
    return { success: false, message: "Loi khi cap nhat trang thai diem danh." };
  }

  return { success: true, message: `Chao mung ${attendee.full_name}!` };
}
