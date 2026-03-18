import Link from "next/link";
import { deleteAttendeeAction, importCSVAction, upsertAttendeeAction } from "@/app/actions";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getAttendees } from "@/lib/attendance";

export const dynamic = "force-dynamic";

type ManagePageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function ManagePage({ searchParams }: ManagePageProps) {
  await requireAdminAuth();
  const params = await searchParams;
  const attendees = (await getAttendees()).sort((a, b) =>
    (a.organization_name || a.full_name).localeCompare(
      b.organization_name || b.full_name,
      "vi",
    ),
  );

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

      <section className="admin-grid">
        <aside className="panel content-panel sidebar">
          <div>
            <h1 className="section-title">CRUD người tham gia</h1>
            <p className="muted">Thêm mới và chỉnh sửa dữ liệu tại trang riêng để màn hình theo dõi gọn hơn.</p>
          </div>

          {params.message ? (
            <div
              className={`notice ${
                params.status === "success" ? "notice-success" : "notice-error"
              }`}
              style={{ marginTop: 12 }}
            >
              {params.message}
            </div>
          ) : null}

          <form action={upsertAttendeeAction} className="stack" style={{ marginTop: 16 }}>
            <h2 style={{ margin: 0 }}>Thêm mới</h2>
            <label className="label">
              <span>Tên đơn vị công tác</span>
              <input className="input" name="organizationName" required />
            </label>
            <label className="label">
              <span>Họ và tên</span>
              <input className="input" name="fullName" required />
            </label>
            <label className="label">
              <span>Email</span>
              <input className="input" name="email" type="email" required />
            </label>
            <label className="label">
              <span>Số điện thoại</span>
              <input className="input" name="phoneNumber" required />
            </label>
            <label className="label">
              <span>Thời gian điểm danh (ISO datetime)</span>
              <input className="input" name="checkedInAt" placeholder="2026-03-18T08:30:00.000Z" />
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input name="isPresent" type="checkbox" />
              <span>Đã điểm danh</span>
            </label>
            <button className="btn btn-primary" type="submit">
              Lưu người tham gia
            </button>
          </form>

          <form action={importCSVAction} className="stack" style={{ marginTop: 24 }}>
            <h2 style={{ margin: 0 }}>Import từ CSV</h2>
            <p className="muted" style={{ margin: '8px 0' }}>
              Tải file CSV mẫu: <a href="/sample-attendees.csv" download>sample-attendees.csv</a>
            </p>
            <p className="muted" style={{ margin: '8px 0', fontSize: '14px' }}>
              Cột bắt buộc: full_name, organization_name, email, phone_number<br/>
              Cột tùy chọn: is_present (true/false, mặc định false)
            </p>
            <label className="label">
              <span>Chọn file CSV</span>
              <input className="input" name="csvFile" type="file" accept=".csv" required />
            </label>
            <button className="btn btn-secondary" type="submit">
              Import dữ liệu
            </button>
          </form>
        </aside>

        <section className="panel content-panel manage-table">
          <div className="manage-head">
            <h2 style={{ margin: 0 }}>Danh sách dữ liệu</h2>
            <Link className="btn btn-secondary" href="/admin">
              Về trang theo dõi
            </Link>
          </div>

          <div className="manage-list">
            {attendees.map((item) => (
              <article key={item.id} className="manage-item">
                <div className="manage-main">
                  <div className="row-title">{item.organization_name || item.full_name}</div>
                  <div className="row-sub">{item.phone_number}</div>
                  <div className="row-sub">{item.full_name}</div>
                  <div className="row-sub">{item.email}</div>
                </div>
                <div className="manage-side">
                  <span className={`pill ${item.is_present ? "pill-present" : "pill-absent"}`}>
                    {item.is_present ? "Đã điểm danh" : "Chưa điểm danh"}
                  </span>
                  <div className="actions">
                    <Link className="tiny-btn" href={`/admin/edit/${item.id}`}>
                      Sửa
                    </Link>
                    <form action={deleteAttendeeAction}>
                      <input name="id" type="hidden" value={item.id} />
                      <button className="tiny-btn" type="submit">
                        Xóa
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
