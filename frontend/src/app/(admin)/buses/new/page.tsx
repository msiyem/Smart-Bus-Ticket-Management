import { listOperatorsAction } from "@/action/operator.action";
import AdminBusesNewClient from "@/components/admin/pages/admin-buses-new-client";
import type { Operator } from "@/lib/types";

export default async function AdminBusesNewPage() {
  const operatorsResponse = await listOperatorsAction();
  const operators: Operator[] =
    operatorsResponse.success && Array.isArray(operatorsResponse.data)
      ? (operatorsResponse.data as Operator[])
      : [];

  return <AdminBusesNewClient operators={operators} />;
}