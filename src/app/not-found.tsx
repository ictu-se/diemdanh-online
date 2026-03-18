import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <section className="panel content-panel">
        <h1 className="section-title">Không tìm thấy trang</h1>
        <p className="muted">Trang bạn tìm không tồn tại hoặc dữ liệu đã bị xóa.</p>
        <Link className="btn btn-primary" href="/">Về trang điểm danh</Link>
      </section>
    </main>
  );
}
