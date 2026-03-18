"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkInByPhoneNumber } from "@/lib/attendance";
import { clearAdminAuthCookie, requireAdminAuth, setAdminAuthCookie } from "@/lib/admin-auth";
import { getEnvOrDefault } from "@/lib/env";
import { normalizePhoneNumber } from "@/lib/phone";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function submitCheckInAction(formData: FormData) {
  const phoneNumber = String(formData.get("phoneNumber") ?? "");
  const result = await checkInByPhoneNumber(phoneNumber);
  const params = new URLSearchParams({
    status: result.success ? "success" : "error",
    message: result.message,
  });

  redirect(`/?${params.toString()}`);
}

export async function adminLoginAction(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  const adminPasscode = getEnvOrDefault("ADMIN_PASSCODE", "0944550550");

  if (passcode !== adminPasscode) {
    redirect("/admin/login?status=error&message=Sai+m%C3%A3+qu%E1%BA%A3n+tr%E1%BB%8B.");
  }

  await setAdminAuthCookie();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminAuthCookie();
  redirect("/admin/login");
}

export async function upsertAttendeeAction(formData: FormData) {
  await requireAdminAuth();
  const supabase = createSupabaseAdminClient();
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const isPresent = formData.get("isPresent") === "on";
  const checkedInAtValue = String(formData.get("checkedInAt") ?? "").trim();

  if (!organizationName || !fullName || !email || !phoneNumber) {
    redirect("/admin/manage?status=error&message=Vui+l%C3%B2ng+nh%E1%BA%ADp+%C4%91%E1%BB%A7+t%C3%AAn+%C4%91%C6%A1n+v%E1%BB%8B,+h%E1%BB%8D+t%C3%AAn,+email+v%C3%A0+s%E1%BB%91+%C4%91i%E1%BB%87n+tho%E1%BA%A1i.");
  }

  const payload = {
    full_name: fullName,
    organization_name: organizationName,
    email,
    phone_number: phoneNumber,
    is_present: isPresent,
    checked_in_at: isPresent ? (checkedInAtValue || new Date().toISOString()) : null,
  };

  if (id) {
    const { error } = await supabase.from("attendees").update(payload).eq("id", id);
    if (error) {
      redirect(`/admin/manage?status=error&message=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await supabase.from("attendees").insert(payload);
    if (error) {
      redirect(`/admin/manage?status=error&message=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  redirect("/admin/manage?status=success&message=L%C6%B0u+d%E1%BB%AF+li%E1%BB%87u+th%C3%A0nh+c%C3%B4ng.");
}

export async function deleteAttendeeAction(formData: FormData) {
  await requireAdminAuth();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/admin/manage?status=error&message=Thi%E1%BA%BFu+m%C3%A3+ng%C6%B0%E1%BB%9Di+tham+gia.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("attendees").delete().eq("id", id);

  if (error) {
    redirect(`/admin/manage?status=error&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  redirect("/admin/manage?status=success&message=X%C3%B3a+th%C3%A0nh+c%C3%B4ng.");
}

export async function importCSVAction(formData: FormData) {
  await requireAdminAuth();
  const file = formData.get("csvFile") as File;

  if (!file || file.size === 0) {
    redirect("/admin/manage?status=error&message=Vui+l%C3%B2ng+ch%E1%BB%8Dn+file+CSV+h%E1%BB%A3p+l%E1%BB%87.");
  }

  if (!file.name.endsWith('.csv')) {
    redirect("/admin/manage?status=error&message=Ch%E1%BB%89+ch%E1%BA%A5p+nh%E1%BA%ADn+file+CSV.");
  }

  const csvText = await file.text();
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    redirect("/admin/manage?status=error&message=File+CSV+ph%E1%BA%A3i+c%C3%B3+%C3%ADt+nh%E1%BA%A5t+header+v%C3%A0+1+d%C3%B2ng+d%E1%BB%AF+li%E1%BB%87u.");
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const expectedHeaders = ['full_name', 'organization_name', 'email', 'phone_number'];
  const hasIsPresent = headers.includes('is_present');

  if (!expectedHeaders.every(h => headers.includes(h))) {
    redirect("/admin/manage?status=error&message=Header+CSV+ph%E1%BA%A3i+ch%E1%BB%A9a+c%C3%A1c+c%E1%BB%99t:+full_name,+organization_name,+email,+phone_number.+(is_present+l%C3%A0+t%C3%B9y+ch%E1%BB%8Dn)");
  }

  const supabase = createSupabaseAdminClient();
  const attendees = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, '')); // Remove quotes if any
    if (values.length !== headers.length) {
      errors.push(`Dòng ${i + 1}: Số cột không khớp`);
      continue;
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    const fullName = row.full_name?.trim();
    const organizationName = row.organization_name?.trim() || '';
    const email = row.email?.trim();
    const phoneNumber = row.phone_number?.trim();
    const isPresent = hasIsPresent ? (row.is_present?.trim().toLowerCase() === 'true') : false;

    if (!fullName || !email || !phoneNumber) {
      errors.push(`Dòng ${i + 1}: Thiếu thông tin bắt buộc (tên, email, hoặc số điện thoại)`);
      continue;
    }

    attendees.push({
      full_name: fullName,
      organization_name: organizationName,
      email,
      phone_number: phoneNumber,
      is_present: isPresent,
      checked_in_at: isPresent ? new Date().toISOString() : null,
    });
  }

  if (errors.length > 0) {
    redirect(`/admin/manage?status=error&message=${encodeURIComponent('Lỗi trong file CSV:\n' + errors.join('\n'))}`);
  }

  if (attendees.length === 0) {
    redirect("/admin/manage?status=error&message=Kh%C3%B4ng+c%C3%B3+d%E1%BB%AF+li%E1%BB%87u+h%E1%BB%A3p+l%E1%BB%87+%C4%91%E1%BB%83+import.");
  }

  const { error } = await supabase.from("attendees").insert(attendees);

  if (error) {
    redirect(`/admin/manage?status=error&message=${encodeURIComponent('Lỗi khi import: ' + error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  redirect(`/admin/manage?status=success&message=Import+th%C3%A0nh+c%C3%B4ng+${attendees.length}+ng%C6%B0%E1%BB%9Di+tham+gia.`);
}
