import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-widest font-meta font-black active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand-green)] text-white hover:opacity-90 shadow-lg shadow-brand-green/20",
        secondary:
          "bg-[var(--brand-gold)] text-charcoal-dark hover:opacity-90 shadow-md",
        accent:
          "bg-[var(--brand-red)] text-white hover:opacity-90 shadow-lg shadow-brand-red/20",
        danger:
          "bg-transparent border-2 border-red-100 text-[var(--brand-red)] hover:bg-[var(--brand-red)] hover:text-white",
        outline:
          "border border-input bg-background hover:bg-stone-100 hover:text-stone-900",

        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-8 py-4 text-[11px]",
        sm: "h-9 px-4 py-2 text-[10px]",
        md: "h-12 px-8 py-4 text-[11px]",
        lg: "h-14 px-12 py-6 text-xs",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
