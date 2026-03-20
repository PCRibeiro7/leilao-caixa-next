import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    helperText?: string;
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, helperText, startAdornment, endAdornment, ...props }, ref) => {
        return (
            <div className="flex flex-col">
                {label && <label className="mb-1 text-sm  text-gray-700">{label}</label>}
                <div
                    className={cn(
                        "flex items-center h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background overflow-hidden disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                    )}
                >
                    {startAdornment && (
                        <span className="px-2 text-sm text-muted-foreground shrink-0">{startAdornment}</span>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex-1 min-w-0 px-2 py-2 bg-transparent placeholder:text-muted-foreground focus:outline-none disabled:opacity-50",
                        )}
                        ref={ref}
                        {...props}
                    />
                    {endAdornment && <span className="px-3 text-sm text-muted-foreground">{endAdornment}</span>}
                </div>
                {helperText && <span className="mt-1 text-xs text-muted-foreground">{helperText}</span>}
            </div>
        );
    },
);
Input.displayName = "Input";

export { Input };
