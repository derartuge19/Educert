"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, checked, ...props }, ref) => {
        return (
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                    className={cn(
                        "peer h-6 w-6 shrink-0 appearance-none rounded-lg border-2 border-slate-200 bg-white shadow-sm ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:border-indigo-600 checked:bg-indigo-600",
                        className
                    )}
                    {...props}
                />
                <Check className="absolute left-1 top-1 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none" />
            </div>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
