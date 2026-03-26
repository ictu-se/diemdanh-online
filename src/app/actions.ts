"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkInByPhoneNumber } from "@/lib/attendance";
import { clearAdminAuthCookie, requireAdminAuth, setAdminAuthCookie } from "@/lib/admin-auth";
import { getEnvOrDefault } from "@/lib/env";
import { normalizePhoneNumber } from "@/lib/phone";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

function parseCSVLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"|"$/g, ""));
}

function normalizeCSVHeader(header: string) {
  return header.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function buildImportEmail(fullName: string, phoneNumber: string, rowNumber: number) {
  const slug = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return `${slug || `user.${rowNumber}`}.${phoneNumber.slice(-4)}@import.local`;
}

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
    checked_in_at: isPresent ? checkedInAtValue || new Date().toISOString() : null,
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

  if (!file.name.toLowerCase().endsWith(".csv")) {
    redirect("/admin/manage?status=error&message=Ch%E1%BB%89+ch%E1%BA%A5p+nh%E1%BA%ADn+file+CSV.");
  }

  const csvText = await file.text();
  const lines = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    redirect("/admin/manage?status=error&message=File+CSV+ph%E1%BA%A3i+c%C3%B3+%C3%ADt+nh%E1%BA%A5t+header+v%C3%A0+1+d%C3%B2ng+d%E1%BB%AF+li%E1%BB%87u.");
  }

  const headers = parseCSVLine(lines[0]).map(normalizeCSVHeader);
  const headerAliases: Record<string, string[]> = {
    full_name: ["full_name", "ho va ten", "họ và tên", "ten", "tên"],
    organization_name: ["organization_name", "don vi", "đơn vị", "ten don vi", "tên đơn vị", "sheet", "khoa", "lop", "lớp"],
    email: ["email", "e-mail", "mail"],
    phone_number: [
      "phone_number",
      "so dien thoai",
      "số điện thoại",
      "dien thoai",
      "điện thoại",
      "so dien thoai lien he",
      "điện thoại liên hệ",
    ],
    is_present: ["is_present"],
  };

  const findHeaderIndex = (field: string) =>
    headers.findIndex((header) => headerAliases[field]?.includes(header));

  const fullNameIndex = findHeaderIndex("full_name");
  const organizationNameIndex = findHeaderIndex("organization_name");
  const emailIndex = findHeaderIndex("email");
  const phoneNumberIndex = findHeaderIndex("phone_number");
  const isPresentIndex = findHeaderIndex("is_present");

  if (fullNameIndex === -1 || phoneNumberIndex === -1) {
    redirect("/admin/manage?status=error&message=File+CSV+c%E1%BA%A7n+c%C3%B3+%C3%ADt+nh%E1%BA%A5t+c%E1%BB%99t+h%E1%BB%8D+t%C3%AAn+v%C3%A0+s%E1%BB%91+%C4%91i%E1%BB%87n+tho%E1%BA%A1i.+C%C3%B3+th%E1%BB%83+d%C3%B9ng+header+ki%E1%BB%83u+full_name%2C+phone_number+ho%E1%BA%B7c+H%E1%BB%8D+v%C3%A0+t%C3%AAn%2C+S%E1%BB%91+%C4%91i%E1%BB%87n+tho%E1%BA%A1i.");
  }

  const supabase = createSupabaseAdminClient();
  const attendees: Array<{
    full_name: string;
    organization_name: string;
    email: string;
    phone_number: string;
    is_present: boolean;
    checked_in_at: string | null;
  }> = [];
  const errors: string[] = [];
  const seenPhoneNumbers = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) {
      errors.push(`Dòng ${i + 1}: Số cột không khớp`);
      continue;
    }

    const fullName = values[fullNameIndex]?.trim();
    const organizationName = organizationNameIndex === -1 ? "" : values[organizationNameIndex]?.trim() || "";
    const rawEmail = emailIndex === -1 ? "" : values[emailIndex]?.trim();
    const phoneNumber = normalizePhoneNumber(values[phoneNumberIndex] ?? "");
    const isPresentValue = isPresentIndex === -1 ? "" : values[isPresentIndex]?.trim().toLowerCase();
    const isPresent = isPresentValue === "true" || isPresentValue === "1" || isPresentValue === "x";

    if (!fullName || !phoneNumber) {
      errors.push(`Dòng ${i + 1}: Thiếu họ tên hoặc số điện thoại`);
      continue;
    }

    if (seenPhoneNumbers.has(phoneNumber)) {
      continue;
    }
    seenPhoneNumbers.add(phoneNumber);

    attendees.push({
      full_name: fullName,
      organization_name: organizationName,
      email: rawEmail || buildImportEmail(fullName, phoneNumber, i + 1),
      phone_number: phoneNumber,
      is_present: isPresent,
      checked_in_at: isPresent ? new Date().toISOString() : null,
    });
  }

  if (errors.length > 0) {
    redirect(`/admin/manage?status=error&message=${encodeURIComponent(`Lỗi trong file CSV:\n${errors.join("\n")}`)}`);
  }

  if (attendees.length === 0) {
    redirect("/admin/manage?status=error&message=Kh%C3%B4ng+c%C3%B3+d%E1%BB%AF+li%E1%BB%87u+h%E1%BB%A3p+l%E1%BB%87+%C4%91%E1%BB%83+import.");
  }

  const { error } = await supabase.from("attendees").upsert(attendees, {
    onConflict: "phone_number",
    ignoreDuplicates: false,
  });

  if (error) {
    redirect(`/admin/manage?status=error&message=${encodeURIComponent(`Lỗi khi import: ${error.message}`)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  redirect(`/admin/manage?status=success&message=Import+th%C3%A0nh+c%C3%B4ng+${attendees.length}+ng%C6%B0%E1%BB%9Di+tham+gia.`);
}

export async function clearAllAttendeesAction() {
  await requireAdminAuth();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("attendees")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    redirect(`/admin/manage?status=error&message=${encodeURIComponent(`Lỗi khi xóa dữ liệu: ${error.message}`)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  redirect("/admin/manage?status=success&message=X%C3%B3a+t%E1%BA%A5t+c%E1%BA%A3+d%E1%BB%AF+li%E1%BB%87u+th%C3%A0nh+c%C3%B4ng.");
}
