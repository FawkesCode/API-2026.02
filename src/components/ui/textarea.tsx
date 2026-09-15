import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-none rounded-2xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "transition-colors duration-150",
        "hover:border-cyan-300",
        "focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300/40",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }