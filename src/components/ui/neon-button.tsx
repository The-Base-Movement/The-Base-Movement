import React from 'react'
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cn } from '@/lib/utils'
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./neon-button-variants";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { 
    neon?: boolean 
    asChild?: boolean
    variant?: "link" | "default" | "solid" | "primary" | "accent" | "gold" | "ghost" | "outline" | null | undefined
}


const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, neon = true, size, variant, asChild = false, children, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        
        return (
            <Comp
                className={cn(buttonVariants({ variant, size }), className)}
                ref={ref}
                {...props}
            >
                <span className={cn("absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 top-0 bg-gradient-to-r w-3/4 mx-auto from-transparent via-brand-green to-transparent hidden", neon && "block")} />
                <Slottable>{children}</Slottable>
                <span className={cn("absolute group-hover:opacity-60 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-brand-green to-transparent hidden", neon && "block")} />
                
                {/* Secondary glow for gold variant */}
                {variant === 'gold' && (
                    <span className={cn("absolute group-hover:opacity-60 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-brand-gold to-transparent hidden", neon && "block")} />
                )}
            </Comp>
        );
    }
)

Button.displayName = 'Button';

export { Button };



