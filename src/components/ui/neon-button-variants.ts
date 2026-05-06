import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "relative group border text-foreground mx-auto text-center rounded-sm transition-all duration-200 overflow-hidden inline-flex items-center justify-center gap-2",
    {
        variants: {
            variant: {
                default: "bg-brand-green/5 hover:bg-brand-green/10 border-brand-green/20 text-brand-green font-bold uppercase tracking-widest",
                solid: "bg-brand-green hover:bg-brand-green/90 text-white border-transparent hover:border-white/20 transition-all duration-200 font-bold uppercase tracking-widest shadow-lg shadow-brand-green/20",
                primary: "bg-brand-green text-white hover:bg-brand-green/90 border-brand-green shadow-[0_0_15px_rgba(34,197,94,0.3)] font-bold uppercase tracking-widest",
                accent: "bg-brand-gold text-white hover:bg-brand-gold/90 border-brand-gold shadow-[0_0_15px_rgba(234,179,8,0.3)] font-bold uppercase tracking-widest",
                gold: "bg-brand-gold hover:bg-brand-gold/90 text-charcoal-dark border-transparent font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.3)]",
                ghost: "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-500 font-bold uppercase tracking-widest",
                link: "border-transparent bg-transparent hover:underline p-0 h-auto font-bold uppercase tracking-widest",
            },
            size: {
                default: "px-7 py-2.5 text-[10px]",
                sm: "px-4 py-1.5 text-[9px]",
                lg: "px-10 py-3.5 text-[11px]",
                icon: "h-9 w-9 p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);
