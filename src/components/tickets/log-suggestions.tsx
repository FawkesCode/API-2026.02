import { cn } from "cn";

function LogSuggestion({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"button"> & { tone?: "neutral" | "approve" | "deny" }) {
  return (
    <button
      type="button"
      data-slot="log-suggestion"
      className={cn(
        "cursor-pointer rounded-full border px-5 py-1.5 text-sm xl:text-xs focus-visible:outline-2 focus-visible:outline-offset-2",
        tone === "approve"
          ? "border-green-700 bg-green-700 font-semibold text-white hover:border-green-800 hover:bg-green-800 focus-visible:outline-green-700"
          : tone === "deny"
            ? "border-red-700 bg-red-700 font-semibold text-white hover:border-red-800 hover:bg-red-800 focus-visible:outline-red-700"
            : "border-gray-200 bg-gray-50 text-muted-foreground hover:bg-gray-100",
        "transition-colors disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { LogSuggestion };
