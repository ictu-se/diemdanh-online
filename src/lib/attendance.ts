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
  const { data: attendee, error } = await supabase
    .from("attendees")
    .select("*")
    .eq("phone_number", normalized)
    .maybeSingle();

  if (error) {
    return { success: false, message: "Khong the ket noi du lieu luc nay." };
  }

  if (!attendee) {
    return { success: false, message: "Khong tim thay so dien thoai trong danh sach." };
  }

  if (attendee.is_present) {
    return { success: false, message: `${attendee.full_name} da diem danh truoc do.` };
  }

  const { error: updateError } = await supabase
    .from("attendees")
    .update({
      is_present: true,
      checked_in_at: new Date().toISOString(),
    })
    .eq("id", attendee.id);

  if (updateError) {
    return { success: false, message: "Khong the cap nhat diem danh." };
  }

  return { success: true, message: `Diem danh thanh cong cho ${attendee.full_name}.` };
}
