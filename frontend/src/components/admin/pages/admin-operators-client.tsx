"use client";

import React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteOperatorAction,
  listOperatorsAction,
} from "@/action/operator.action";
import type { Operator, User } from "@/lib/types";

export default function AdminOperatorsClient({
  initialOperators,
  initialUsers,
}: {
  initialOperators: Operator[];
  initialUsers: User[];
}) {
  const [operators, setOperators] =
    React.useState<Operator[]>(initialOperators);
  const [users] = React.useState<User[]>(initialUsers);

  const ownersById = React.useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );

  const loadOperators = React.useCallback(async () => {
    const response = await listOperatorsAction();
    if (response.success && Array.isArray(response.data)) {
      setOperators(response.data as Operator[]);
      return;
    }
    toast.error(response.message || "Failed to load operators");
  }, []);

  const handleDelete = async (operatorId: number) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this operator? This cannot be undone.")
    ) {
      return;
    }
    const result = await deleteOperatorAction(operatorId);
    if (result.success) {
      toast.success("Operator deleted");
      await loadOperators();
    } else {
      toast.error(result.message || "Failed to delete operator");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operator Management"
        description="Link a registered user to a bus-operator company and keep their active status in sync."
        action={{ label: "Create operator", href: "/operators/new" }}
      />

      <AdminPanel
        title="Existing Operators"
        description="Operators currently linked to user accounts."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-[80px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operators.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-muted-foreground"
                >
                  No operators found.
                </TableCell>
              </TableRow>
            ) : (
              operators.map((op) => {
                const owner = ownersById.get(op.owner_user_id);
                return (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">
                      {op.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{owner?.name || "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {owner?.email || op.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span>{op.email}</span>
                        <span className="text-muted-foreground">
                          {op.phone || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {op.address || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(op.id)}
                        aria-label="Delete operator"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </AdminPanel>
    </div>
  );
}