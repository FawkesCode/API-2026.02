import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const priorityBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-[5px] border px-3.5 py-1 text-xs font-medium",
  {
    variants: {
      priority: {
        critical: "border-priority-critical bg-priority-critical-bg text-priority-critical",
        high: "border-priority-high bg-priority-high-bg text-priority-high",
        medium: "border-priority-medium bg-priority-medium-bg text-priority-medium",
        low: "border-priority-low bg-priority-low-bg text-priority-low",
      },
    },
    defaultVariants: {
      priority: "critical",
    },
  }
);

function PriorityBadge({
  className,
  priority = "critical",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof priorityBadgeVariants>) {
  return (
    <span
      data-slot="priority-badge"
      className={cn(priorityBadgeVariants({ priority, className }))}
      {...props}
    />
  );
}

export { PriorityBadge, priorityBadgeVariants };
