import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input name="name-4abce8" id="input-4abce8"
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border h-[42px] w-full min-w-0 rounded-[4px] border-outline-variant bg-white px-3 py-[10px] text-[13px] text-on-surface transition-[border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:border-primary focus:shadow-[inset_0_0_0_2px_rgba(0,107,63,0.08)]",
        "aria-invalid:border-destructive aria-invalid:shadow-[inset_0_0_0_2px_rgba(206,17,38,0.08)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
