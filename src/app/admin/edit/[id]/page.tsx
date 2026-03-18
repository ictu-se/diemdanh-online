import Link from "next/link";
import { notFound } from "next/navigation";
import { upsertAttendeeAction } from "@/app/actions";
import { requireAdminAuth } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditAttendeePage({ params }: EditPageProps) {
  await requireAdminAuth();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: attendee, error } = await supabase
    .from("attendees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !attendee) {
    notFound();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">DiemDanh Online</div>
        <nav className="nav">
          <Link href="/">Điểm danh</Link>
          <Link href="/admin">Quản trị</Link>
          <Link href="/admin/manage">Quản lý dữ liệu</Link>
        </nav>
      </header>

      <section className="panel content-panel" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 className="section-title">Sửa người tham gia</h1>
        <p className="muted">Cập nhật thông tin, trạng thái điểm danh và thời gian nếu cần.</p>

        <form action={upsertAttendeeAction} className="stack">
          <input name="id" type="hidden" value={attendee.id} />
          <label className="label">
            <span>Tên đơn vị công tác</span>
            <input
              className="input"
              defaultValue={attendee.organization_name ?? ""}
              name="organizationName"
              required
            />
          </label>
          <label className="label">
            <span>Họ và tên</span>
            <input className="input" defaultValue={attendee.full_name} name="fullName" required />
          </label>
          <label className="label">
            <span>Email</span>
            <input className="input" defaultValue={attendee.email} name="email" required />
          </label>
          <label className="label">
            <span>Số điện thoại</span>
            <input className="input" defaultValue={attendee.phone_number} name="phoneNumber" required />
          </label>
          <label className="label">
            <span>Thời gian điểm danh (ISO datetime)</span>
            <input className="input" defaultValue={attendee.checked_in_at ?? ""} name="checkedInAt" />
          </label>
          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input defaultChecked={attendee.is_present} name="isPresent" type="checkbox" />
            <span>Đã điểm danh</span>
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="submit">Lưu thay đổi</button>
            <Link className="btn btn-secondary" href="/admin/manage">Quay lại</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
