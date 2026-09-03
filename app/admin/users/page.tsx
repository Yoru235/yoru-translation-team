"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Role = "OWNER" | "ADMIN" | "EDITOR";

type User = {
  id: string;
  email: string;
  username: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = {
  success: boolean;
  users?: User[];
  error?: string;
};

type RoleResponse = {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDITOR">("EDITOR");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // TẢI DANH SÁCH THÀNH VIÊN
  // ==========================================

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as UsersResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể tải danh sách thành viên."
        );
      }

      setUsers(data.users ?? []);
    } catch (err) {
      console.error("LOAD USERS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách thành viên."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  // ==========================================
  // CẤP / ĐỔI QUYỀN
  // ==========================================

  const handleRoleUpdate = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (!email.trim()) {
        setError("Vui lòng nhập email.");
        return;
      }

      const response = await fetch("/api/admin/users/role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      });

      const data = (await response.json()) as RoleResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể cấp quyền."
        );
      }

      setSuccess(
        data.message || "Đã cập nhật quyền thành công."
      );

      setEmail("");

      await loadUsers();
    } catch (err) {
      console.error("UPDATE USER ROLE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể cấp quyền."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // GIAO DIỆN
  // ==========================================

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-purple-900 bg-black/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6">

          <div>
            <p className="text-sm font-semibold text-purple-400">
              Yoru Translation Group
            </p>

            <h1 className="text-2xl font-extrabold">
              Quản lý thành viên
            </h1>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-gray-700 bg-[#111111] px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-300"
          >
            ← Dashboard
          </Link>

        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* THÔNG BÁO LỖI */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/20 p-5">
            <p className="font-bold text-red-400">
              ❌ {error}
            </p>
          </div>
        )}

        {/* THÔNG BÁO THÀNH CÔNG */}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-900 bg-green-950/20 p-5">
            <p className="font-bold text-green-400">
              ✅ {success}
            </p>
          </div>
        )}

        {/* CẤP QUYỀN */}

        <section className="rounded-3xl border border-purple-900 bg-[#0b0b0b] p-6">

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold">
              Cấp quyền thành viên
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Nhập email của tài khoản đã tồn tại trên hệ thống,
              sau đó chọn vai trò muốn cấp.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">

            {/* EMAIL */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="example@gmail.com"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />
            </div>

            {/* ROLE */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Vai trò
              </label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as
                      | "ADMIN"
                      | "EDITOR"
                  )
                }
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none focus:border-purple-600"
              >
                <option value="EDITOR">
                  EDITOR - Nhóm dịch
                </option>

                <option value="ADMIN">
                  ADMIN - Quản trị
                </option>
              </select>
            </div>

            {/* BUTTON */}

            <div className="flex items-end">
              <button
                type="button"
                onClick={() =>
                  void handleRoleUpdate()
                }
                disabled={isSaving}
                className="w-full rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {isSaving
                  ? "⏳ Đang xử lý..."
                  : "🔑 Cấp quyền"}
              </button>
            </div>

          </div>

        </section>

        {/* DANH SÁCH */}

        <section className="mt-8">

          <div className="mb-5">
            <h2 className="text-2xl font-extrabold">
              Thành viên hệ thống
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Danh sách các tài khoản và quyền hiện tại.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-gray-800 bg-[#0b0b0b] px-6 py-20 text-center">
              <p className="font-semibold text-gray-400">
                Đang tải danh sách thành viên...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-[#0b0b0b] px-6 py-20 text-center">
              <p className="font-semibold text-gray-400">
                Chưa có tài khoản nào.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-800 bg-[#0b0b0b]">

              <div className="divide-y divide-gray-800">

                {users.map((user) => (

                  <div
                    key={user.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-[#111111] md:flex-row md:items-center md:justify-between"
                  >

                    <div className="min-w-0">

                      <p className="font-bold text-white">
                        {user.username}
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-500">
                        {user.email}
                      </p>

                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                      <span
                        className={
                          user.role === "OWNER"
                            ? "rounded-full bg-yellow-950 px-3 py-1 text-xs font-bold text-yellow-400"
                            : user.role === "ADMIN"
                            ? "rounded-full bg-purple-950 px-3 py-1 text-xs font-bold text-purple-300"
                            : "rounded-full bg-blue-950 px-3 py-1 text-xs font-bold text-blue-300"
                        }
                      >
                        {user.role}
                      </span>

                      <span
                        className={
                          user.isActive
                            ? "rounded-full bg-green-950 px-3 py-1 text-xs font-bold text-green-400"
                            : "rounded-full bg-red-950 px-3 py-1 text-xs font-bold text-red-400"
                        }
                      >
                        {user.isActive
                          ? "Đang hoạt động"
                          : "Đã khóa"}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </div>
          )}

        </section>

      </div>

    </main>
  );
}