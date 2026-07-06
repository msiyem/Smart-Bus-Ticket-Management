import { listOperatorsAction } from "@/action/operator.action";
import { getAllUsers } from "@/action/users.action";
import AdminOperatorsClient from "@/components/admin/pages/admin-operators-client";
import type { Operator, User } from "@/lib/types";

export default async function AdminOperatorsPage() {
  const [operatorsResponse, usersResponse] = await Promise.all([
    listOperatorsAction(),
    getAllUsers(),
  ]);

  const operators: Operator[] =
    operatorsResponse.success && Array.isArray(operatorsResponse.data)
      ? (operatorsResponse.data as Operator[])
      : [];

  const users: User[] =
    usersResponse.success && Array.isArray(usersResponse)
      ? (usersResponse as User[])
      : [];

  return (
    <AdminOperatorsClient initialOperators={operators} initialUsers={users} />
  );
}
