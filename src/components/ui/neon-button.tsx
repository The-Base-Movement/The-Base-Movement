import React from 'react'
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cn } from '@/lib/utils'
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./neon-button-variants";
import { useBranding } from "@/hooks/useBranding";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { 
    neon?: boolean 
    asChild?: boolean
    variant?: "link" | "default" | "solid" | "primary" | "accent" | "gold" | "ghost" | "outline" | "destructive" | null | undefined
}


const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, neon, size, variant, asChild = false, children, ...props }, ref) => {
        const { settings } = useBranding()
        const isNeonEnabled = neon !== undefined ? neon : (settings.button_neon_enabled ?? true)
        const Comp = asChild ? Slot : "button"
        
        const getGlowColor = () => {
            if (variant === 'destructive') return 'via-brand-red';
            if (variant === 'gold' || variant === 'accent') return 'via-brand-gold';
            return 'via-brand-green';
        }

        const glowColor = getGlowColor();
        
        return (
            <Comp
                className={cn(buttonVariants({ variant, size }), className)}
                ref={ref}
                {...props}
            >
                <span className={cn("absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 top-0 bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden", glowColor, isNeonEnabled && "block")} />
                <Slottable>{children}</Slottable>
                <span className={cn("absolute group-hover:opacity-60 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden", glowColor, isNeonEnabled && "block")} />
            </Comp>
        );
    }
)

Button.displayName = 'Button';

export { Button };



