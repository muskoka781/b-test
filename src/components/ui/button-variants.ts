import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold tracking-normal transition-all duration-200 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[4px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          'border border-white/60 bg-[#ea7a5f] text-white shadow-[0_14px_26px_rgba(234,122,95,0.28),inset_0_1px_0_rgba(255,255,255,0.48)] hover:bg-[#dd6d54] hover:shadow-[0_18px_30px_rgba(234,122,95,0.34),inset_0_1px_0_rgba(255,255,255,0.56)]',
        destructive:
          'border border-white/60 bg-destructive text-white shadow-[0_14px_26px_rgba(220,38,38,0.22),inset_0_1px_0_rgba(255,255,255,0.42)] hover:bg-destructive/90 focus-visible:ring-destructive/20',
        outline:
          'border border-white/70 bg-white/55 text-slate-700 shadow-[8px_8px_18px_rgba(154,107,72,0.12),-8px_-8px_18px_rgba(255,255,255,0.72)] hover:bg-white/75 hover:text-slate-950',
        secondary:
          'border border-white/65 bg-[#dceee8] text-slate-700 shadow-[8px_8px_18px_rgba(79,123,113,0.14),-8px_-8px_18px_rgba(255,255,255,0.65)] hover:bg-[#d1e8e0] hover:text-slate-950',
        ghost:
          'bg-white/60 text-slate-600 shadow-[6px_6px_14px_rgba(154,107,72,0.1),-6px_-6px_14px_rgba(255,255,255,0.68)] hover:bg-white/85 hover:text-slate-950',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-9 gap-1.5 rounded-xl px-3.5 has-[>svg]:px-3',
        lg: 'h-12 px-7 has-[>svg]:px-5',
        icon: 'size-9 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
