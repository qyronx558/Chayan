import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
 "inline-flex items-center rounded-none border px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
 {
  variants: {
   variant: {
    default:
     "border-transparent bg-foreground text-background hover:bg-foreground/90",
    secondary:
     "border-rule bg-paper-2 text-foreground hover:bg-paper-3",
    destructive:
     "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border-rule-2 bg-transparent text-foreground",
   },
  },
  defaultVariants: {
   variant: "default",
  },
 }
)

export interface BadgeProps
 extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
 return (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
 )
}

export { Badge, badgeVariants }
