import { listOperatorsAction } from "@/action/operator.action";
import { getAllUsers } from "@/action/users.action";
import AdminOperatorsNewClient from "@/components/admin/pages/admin-operators-new-client";
import type { Operator, User } from "@/lib/types";

export default async function AdminOperatorsNewPage() {
  const [operatorsResponse, usersResponse] = await Promise.all([
    listOperatorsAction(),
    getAllUsers(),
  ]);

  const operators: Operator[] =
    operatorsResponse.success && Array.isArray(operatorsResponse.data)
      ? (operatorsResponse.data as Operator[])
      : [];

  const users: User[] =
    usersResponse.success && Array.isArray(usersResponse.data)
      ? (usersResponse.data as User[])
      : [];

  const linkedOwnerIds = operators.map((op) => op.owner_user_id);

  return (
    <AdminOperatorsNewClient
      users={users}
      linkedOwnerIds={linkedOwnerIds}
    />
  );
}