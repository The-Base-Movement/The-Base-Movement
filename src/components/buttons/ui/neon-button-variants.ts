/**
 * Neon Button Variants
 * -------------------------------------------------------------
 * Defines style and layout variants for the premium Neon button system
 * using class-variance-authority. Includes presets for sizes and themed states.
 */

import { cva } from 'class-variance-authority'

/**
 * buttonVariants
 * -------------------------------------------------------------
 * Configured utility defining CSS class combinations for button states.
 */
export const buttonVariants = cva(
  'relative group border text-center transition-all duration-200 inline-flex items-center justify-center gap-2 whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'bg-[hsl(var(--inactive-tab-bg))] text-[hsl(var(--inactive-tab-text))] border-[hsl(var(--primary))]/20 hover:bg-[hsl(var(--inactive-tab-hover))] hover:border-[hsl(var(--primary))]/40 transition-all tracking-tight',
        solid:
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-transparent hover:text-[hsl(var(--primary))] border border-[hsl(var(--primary))] transition-all duration-200 tracking-tight shadow-lg shadow-[hsl(var(--primary))]/20',
        primary:
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-transparent hover:text-[hsl(var(--primary))] border-[hsl(var(--primary))] shadow-[0_0_15px_rgba(var(--brand-green-rgb),0.3)] tracking-tight',
        accent:
          'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent-hover))] border-[hsl(var(--accent))] shadow-[0_0_15px_rgba(var(--brand-gold-rgb),0.3)] tracking-tight',
        gold: 'bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] text-[hsl(var(--accent-foreground))] border-transparent tracking-tight shadow-[0_0_15px_rgba(var(--brand-gold-rgb),0.2)]',
        destructive:
          'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive-hover))] border-[hsl(var(--destructive))] shadow-[0_0_15px_rgba(var(--brand-red-rgb),0.3)] tracking-tight',
        ghost:
          'border-transparent bg-transparent hover:bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))] tracking-tight font-bold',
        outline:
          'bg-transparent border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] text-[hsl(var(--primary))] tracking-tight font-bold',
        'outline-destructive':
          'bg-transparent border-[hsl(var(--destructive))]/40 hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))] text-[hsl(var(--destructive))] tracking-tight font-bold',
        'ghost-destructive':
          'border-transparent bg-transparent hover:bg-[hsl(var(--destructive))]/5 text-[hsl(var(--destructive))] tracking-tight font-bold',
        'active-tab':
          'bg-[hsl(var(--active-tab-bg))] text-white border-[hsl(var(--active-tab-bg))] hover:bg-transparent hover:text-[hsl(var(--active-tab-bg))] tracking-tight',
        link: 'border-transparent bg-transparent p-0 h-auto tracking-tight text-foreground',
      },
      size: {
        default: 'h-[44px] px-[18px] text-[13px] font-bold tracking-tight',
        sm: 'h-[34px] px-[14px] text-[11px] font-bold tracking-tight',
        lg: 'h-[52px] px-[24px] text-[14px] font-bold tracking-tight',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
