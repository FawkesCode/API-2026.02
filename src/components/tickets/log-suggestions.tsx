import { cn } from "cn";

function LogSuggestion({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="log-suggestion"
      className={cn(
        "rounded-full border border-gray-200 bg-gray-50 px-5 py-1.5 text-sm text-muted-foreground",
        "transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { LogSuggestion };
