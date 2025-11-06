"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const ChartContainerVariants = cva("relative", {
  variants: {
    size: {
      default: "h-[300px]",
      sm: "h-[200px]",
      lg: "h-[400px]",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface ChartContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ChartContainerVariants> {}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(({ className, size, ...props }, ref) => {
  return <div className={cn(ChartContainerVariants({ size, className }))} ref={ref} {...props} />
})
ChartContainer.displayName = "ChartContainer"

const ChartLegendVariants = cva("flex items-center space-x-2", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

export interface ChartLegendProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ChartLegendVariants> {}

const ChartLegend = React.forwardRef<HTMLDivElement, ChartLegendProps>(({ className, orientation, ...props }, ref) => {
  return <div className={cn(ChartLegendVariants({ orientation, className }))} ref={ref} {...props} />
})
ChartLegend.displayName = "ChartLegend"

interface ChartLegendItemProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  color: string
}

export const ChartLegendItem = React.forwardRef<HTMLDivElement, ChartLegendItemProps>(
  ({ className, name, color, ...props }, ref) => {
    return (
      <div className="flex items-center space-x-2">
        <span className="block h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium">{name}</span>
      </div>
    )
  },
)
ChartLegendItem.displayName = "ChartLegendItem"

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  labelClassName?: string
  valueClassName?: string
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ className, labelClassName, valueClassName, ...props }, ref) => {
    return <div className={cn("p-2 rounded-md", className)} ref={ref} {...props} />
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: React.ReactNode
}

const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(({ className, content, ...props }, ref) => {
  return (
    <div className={cn("pointer-events-none", className)} ref={ref} {...props}>
      {content}
    </div>
  )
})
ChartTooltip.displayName = "ChartTooltip"

export { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent }

export const Chart = () => {
  return null
}
