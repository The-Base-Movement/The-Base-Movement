import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "relative group border text-center transition-all duration-200 inline-flex items-center justify-center gap-2 whitespace-nowrap",
    {
        variants: {
            variant: {
                default: "bg-brand-green/5 hover:bg-brand-green/10 border-brand-green/20 text-brand-green tracking-tight",
                solid: "bg-brand-green hover:bg-brand-green/90 text-primary-foreground border-transparent hover:border-white/20 transition-all duration-200 tracking-tight shadow-lg shadow-brand-green/20",
                primary: "bg-brand-green text-primary-foreground hover:bg-brand-green/90 border-brand-green shadow-[0_0_15px_rgba(0,107,63,0.3)] tracking-tight",
                accent: "bg-brand-gold text-accent-foreground hover:bg-brand-gold/90 border-brand-gold shadow-[0_0_15px_rgba(218,165,32,0.3)] tracking-tight",
                gold: "bg-brand-gold hover:bg-brand-gold/90 text-accent-foreground border-transparent tracking-tight shadow-[0_0_15px_rgba(218,165,32,0.2)]",
                destructive: "bg-brand-red text-destructive-foreground hover:bg-brand-red/90 border-brand-red shadow-[0_0_15px_rgba(206,17,38,0.3)] tracking-tight",
                ghost: "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-500 tracking-tight",
                outline: "bg-transparent border-border/40 hover:bg-stone-100 text-on-surface/80 tracking-tight",
                link: "border-transparent bg-transparent p-0 h-auto tracking-tight text-foreground",
            },
            size: {
                default: "px-7 py-2.5 text-[12px]",
                sm: "px-4 py-1.5 text-[10px]",
                lg: "px-10 py-3.5 text-[14px]",
                icon: "h-9 w-9 p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);
