import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-emerald-200/70 bg-white/95 p-6 shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-emerald-950/50">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
        Admin Console
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-base text-muted-foreground">{description}</p>
    </div>
  );
}

export function AdminPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-emerald-200/70 bg-white/95 shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-emerald-950/50",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-xl text-foreground">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
