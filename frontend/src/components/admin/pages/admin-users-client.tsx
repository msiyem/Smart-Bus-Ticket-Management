"use client";

import React from "react";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@/lib/types";

export default function AdminUsersClient({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const [users] = React.useState<User[]>(initialUsers);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Review registered users and their current role/status."
      />

      <AdminPanel
        title="Registered Users"
        description="User accounts from the backend database."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Provider</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name || "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="uppercase">{user.role}</TableCell>
                <TableCell>{user.provider || "local"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPanel>
    </div>
  );
}
