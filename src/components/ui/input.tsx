import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
 ({ className, type, ...props }, ref) => {
  return (
   <input
    type={type}
    className={cn(
     "flex h-11 w-full min-w-0 rounded-none border border-rule-2 bg-paper-2 px-3 py-2 text-base text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-focus)] disabled:cursor-not-allowed disabled:opacity-55",
     className
    )}
    ref={ref}
    {...props}
   />
  )
 }
)
Input.displayName = "Input"

export { Input }
