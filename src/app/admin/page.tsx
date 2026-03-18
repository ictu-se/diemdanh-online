import Link from "next/link";
import { adminLogoutAction } from "@/app/actions";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getAttendees } from "@/lib/attendance";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

function splitIntoTwoColumns<T>(items: T[]) {
  const middle = Math.ceil(items.length / 2);
  return [items.slice(0, middle), items.slice(middle)] as const;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminAuth();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const normalizedQuery = query.toLocaleLowerCase("vi");
  const attendees = await getAttendees();

  const filteredAttendees = normalizedQuery
    ? attendees.filter((item) =>
        [item.full_name, item.email, item.phone_number].some((value) =>
          value.toLocaleLowerCase("vi").includes(normalizedQuery),
        ),
      )
    : attendees;

  const absentAttendees = filteredAttendees
    .filter((item) => !item.is_present)
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "vi"));

  const presentAttendees = filteredAttendees
    .filter((item) => item.is_present)
    .sort((a, b) => {
      const timeA = a.checked_in_at ? new Date(a.checked_in_at).getTime() : 0;
      const timeB = b.checked_in_at ? new Date(b.checked_in_at).getTime() : 0;
      return timeB - timeA;
    });

  const [absentColumnOne, absentColumnTwo] = splitIntoTwoColumns(absentAttendees);
  const [presentColumnOne, presentColumnTwo] = splitIntoTwoColumns(presentAttendees);

  return (
    <main className="shell admin-shell-compact">
      <header className="topbar admin-nav-compact">
        <div className="brand">Điểm danh admin</div>
        <nav className="nav admin-nav-links">
          <Link href="/">Trang điểm danh</Link>
          <Link href="/admin">Theo dõi</Link>
          <Link href="/admin/manage">CRUD</Link>
          <form action={adminLogoutAction}>
            <button className="nav-plain-button" type="submit">
              Đăng xuất
            </button>
          </form>
        </nav>
      </header>

      <form className="admin-searchbar" method="get">
        <input
          aria-label="Tìm kiếm theo tên, email hoặc số điện thoại"
          className="admin-search-input"
          defaultValue={query}
          name="q"
          placeholder="Tìm theo tên, email hoặc số điện thoại"
          type="search"
        />
        <button className="admin-search-button" type="submit">
          Tìm
        </button>
        {query ? (
          <Link className="admin-search-reset" href="/admin">
            Xóa lọc
          </Link>
        ) : null}
      </form>

      <header className="admin-strip">
        <div className="admin-strip-group">
          <span className="admin-strip-label">Chưa điểm danh</span>
          <strong>{absentAttendees.length}</strong>
        </div>
        <div className="admin-strip-group is-present">
          <span className="admin-strip-label">Đã điểm danh</span>
          <strong>{presentAttendees.length}</strong>
        </div>
      </header>

      <section className="admin-quad-grid">
        <div className="mini-column">
          {absentColumnOne.length > 0 ? (
            absentColumnOne.map((item) => (
              <Link
                key={item.id}
                className="compact-row compact-link-row"
                href={`/admin/edit/${item.id}`}
              >
                <span className="compact-inline">
                  {item.full_name}{" "}
                  <span className="compact-inline-phone">({item.phone_number})</span>
                </span>
              </Link>
            ))
          ) : (
            <div className="empty">
              {query ? "Không có kết quả phù hợp." : "Không có dữ liệu."}
            </div>
          )}
        </div>

        <div className="mini-column">
          {absentColumnTwo.length > 0 ? (
            absentColumnTwo.map((item) => (
              <Link
                key={item.id}
                className="compact-row compact-link-row"
                href={`/admin/edit/${item.id}`}
              >
                <span className="compact-inline">
                  {item.full_name}{" "}
                  <span className="compact-inline-phone">({item.phone_number})</span>
                </span>
              </Link>
            ))
          ) : (
            <div className="empty">
              {query ? "Không có kết quả phù hợp." : "Tất cả đã điểm danh."}
            </div>
          )}
        </div>

        <div className="mini-column">
          {presentColumnOne.length > 0 ? (
            presentColumnOne.map((item) => (
              <article key={item.id} className="compact-row">
                <span className="compact-inline">
                  {item.full_name}{" "}
                  <span className="compact-inline-phone">({item.phone_number})</span>
                </span>
              </article>
            ))
          ) : (
            <div className="empty">
              {query ? "Không có kết quả phù hợp." : "Chưa có ai điểm danh."}
            </div>
          )}
        </div>

        <div className="mini-column">
          {presentColumnTwo.length > 0 ? (
            presentColumnTwo.map((item) => (
              <article key={item.id} className="compact-row">
                <span className="compact-inline">
                  {item.full_name}{" "}
                  <span className="compact-inline-phone">({item.phone_number})</span>
                </span>
              </article>
            ))
          ) : (
            <div className="empty">
              {query ? "Không có kết quả phù hợp." : "Chưa có ai điểm danh."}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
