import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants/labels";
import type { ApplicationStatus } from "@/lib/types";
import { cn } from "cn";

const statusStyles: Record<ApplicationStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  submitted: "bg-info-soft text-info border-info/20",
  under_review: "bg-primary/10 text-primary border-primary/20",
  ready_for_compliance: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  action_required: "bg-warning-soft text-warning border-warning/20",
  approved: "bg-success-soft text-success border-success/20",
  rejected: "bg-danger-soft text-danger border-danger/20",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant="outline" className={cn("border", statusStyles[status])}>
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
