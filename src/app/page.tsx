import { submitCheckInAction } from "@/app/actions";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  return (
    <main className="public-shell">
      <section className="public-card">
        <div className="public-unit">
          Khoa Công nghệ thông tin, Trường Đại học Công nghệ thông tin và Truyền thông, Đại học Thái Nguyên
        </div>
        <p className="public-text">
          Vui lòng nhập số điện thoại đã đăng ký để xác nhận tham dự.
        </p>

        <form action={submitCheckInAction} className="stack" style={{ marginTop: 18 }}>
          <label className="label">
            <span>Số điện thoại</span>
            <input
              className="input public-input"
              name="phoneNumber"
              placeholder="Ví dụ: 0912345678"
              required
            />
          </label>

          <button className="btn btn-primary public-button" type="submit">
            Điểm danh ngay
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
      </section>
    </main>
  );
}
