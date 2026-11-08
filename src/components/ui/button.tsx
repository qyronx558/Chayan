"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center whitespace-nowrap rounded-none font-display font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] disabled:pointer-events-none disabled:opacity-55",
 {
  variants: {
   variant: {
    default:
     "border border-transparent bg-foreground text-background hover:bg-foreground/90 active:bg-foreground",
    destructive:
     "border border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive",
    outline:
     "border-x-0 border-y border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
    secondary:
     "border border-rule bg-paper-2 text-foreground hover:bg-paper-3 active:bg-paper-3",
    ghost: "border border-transparent bg-transparent text-foreground hover:bg-paper-2 active:bg-paper-3",
    link: "h-auto border-0 bg-transparent p-0 text-brick underline decoration-1 underline-offset-4 hover:decoration-2",
   },
   size: {
    default: "h-11 px-5 py-2 text-[0.9375rem]",
    sm: "h-10 px-3.5 text-sm",
    lg: "h-12 px-7 text-base",
    icon: "h-11 w-11",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "default",
  },
 }
)

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
 asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
   <Comp
    className={cn(buttonVariants({ variant, size, className }))}
    ref={ref}
    {...props}
   />
  )
 }
)
Button.displayName = "Button"

export { Button, buttonVariants }
