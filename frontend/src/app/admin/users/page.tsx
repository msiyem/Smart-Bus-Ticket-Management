import { getAllUsers } from "@/action/users.action";
import AdminUsersClient from "@/components/admin/pages/admin-users-client";
import type { User } from "@/lib/types";

export default async function AdminUsersPage() {
  const response = await getAllUsers();
  const users: User[] =
    response.success && Array.isArray(response.data) ? response.data : [];

  return <AdminUsersClient initialUsers={users} />;
}
