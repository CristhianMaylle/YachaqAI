import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        concepto: "border-transparent bg-blue-50 text-blue-700",
        entidad: "border-transparent bg-purple-50 text-purple-700",
        fuente: "border-transparent bg-orange-50 text-orange-700",
        pregunta: "border-transparent bg-yellow-50 text-yellow-700",
        modulo: "border-transparent bg-teal-50 text-teal-700",
        success: "border-transparent bg-green-50 text-green-700",
        warning: "border-transparent bg-amber-50 text-amber-700",
        danger: "border-transparent bg-red-50 text-red-700",
        muted: "border-transparent bg-neutral-100 text-neutral-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
