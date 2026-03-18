import Link from "next/link";
import { adminLoginAction } from "@/app/actions";

export const dynamic = "force-dynamic";

type AdminLoginProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginProps) {
  const params = await searchParams;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">DiemDanh Online</div>
        <nav className="nav">
          <Link href="/">Điểm danh</Link>
          <Link href="/admin/login">Đăng nhập admin</Link>
          <Link href="/setup">Hướng dẫn setup</Link>
        </nav>
      </header>

      <section className="panel hero" style={{ gridTemplateColumns: "1fr 420px" }}>
        <div>
          <span className="eyebrow">Bảo vệ trang quản trị</span>
          <h1>Đăng nhập bằng mã quản trị.</h1>
          <p>
            Để đơn giản và miễn phí, ứng dụng này dùng một passcode admin lưu trong biến môi trường trên Vercel.
          </p>
        </div>

        <div className="form-panel">
          <form action={adminLoginAction} className="stack">
            <label className="label">
              <span>Mã quản trị</span>
              <input className="input" name="passcode" type="password" required />
            </label>
            <button className="btn btn-primary" type="submit">
              Đăng nhập
            </button>
          </form>

          {params.message ? (
            <div
              className={`notice ${
                params.status === "success" ? "notice-success" : "notice-error"
              }`}
              style={{ marginTop: 16 }}
            >
              {params.message}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
