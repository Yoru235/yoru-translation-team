import { requireAdmin } from "@/lib/auth/admin";
import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#fdf7ff]">
      <Sidebar />

      <main className="ml-56 min-h-screen">
        <AdminHeader />

        {children}
      </main>
    </div>
  );
}