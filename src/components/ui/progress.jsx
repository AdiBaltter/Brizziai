
import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-white/60", className)}
    {...props}
  >
    <div
      className="h-full bg-blue-500 transition-all rounded-full"
      style={{ width: `${value || 0}%` }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress }
