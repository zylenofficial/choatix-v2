import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 border transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "border-white/20 text-white",
        secondary: "border-white/10 text-white/50",
        outline: "border-white/20 text-white/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
