import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea name="name-12951c" id="textarea-12951c"
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground aria-invalid:border-destructive flex field-sizing-content min-h-[80px] w-full rounded-[4px] border border-outline-variant bg-white px-3 py-[10px] text-[13px] text-on-surface transition-[border-color,box-shadow] outline-none focus:border-primary focus:shadow-[inset_0_0_0_2px_rgba(0,107,63,0.08)] disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
