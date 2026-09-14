import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Button as ButtonPrimitive } from "@base-ui/react/button"

const priorityButtonVariants = cva(
  "inline-flex items-center justify-center rounded-[4px] border px-2.5 py-1.5 text-base font-semibold transition-colors",
  {
    variants: {
      priority: {
        critical: "border-priority-critical text-priority-critical",
        high: "border-priority-high text-priority-high",
        medium: "border-priority-medium text-priority-medium",
        low: "border-priority-low text-priority-low",
      },
      selected: {
        true: "",
        false: "bg-transparent",
      },
    },
    compoundVariants: [
      { priority: "critical", selected: true, className: "bg-priority-critical-bg" },
      { priority: "high", selected: true, className: "bg-priority-high-bg" },
      { priority: "medium", selected: true, className: "bg-priority-medium-bg" },
      { priority: "low", selected: true, className: "bg-priority-low-bg" },
    ],
    defaultVariants: {
      priority: "critical",
      selected: false,
    },
  }
);

function PriorityButton({
  className,
  priority = "critical",
  selected = false,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof priorityButtonVariants>) {
  return (
    <ButtonPrimitive
      type="button"
      data-slot="priority-button"
      aria-pressed={selected ?? false}
      className={cn(
        priorityButtonVariants({ priority, selected, className })
      )}
      {...props}
    />
  );
}

export { PriorityButton, priorityButtonVariants };
