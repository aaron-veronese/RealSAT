import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        destructive:'bg-destructive text-destructive-foreground hover:opacity-75',
        outline:'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground',
        heavyOutline: 'border-2 border-[var(--color-black)] dark:border-[var(--color-white)] bg-background hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        primary: 'bg-[var(--color-primary)] text-[var(--color-light-bg)] dark:text-[var(--color-dark-bg)] hover:opacity-75',
        secondary: 'bg-[var(--color-secondary)] text-[var(--color-light-bg)] dark:text-[var(--color-dark-bg)] hover:opacity-75',
        tertiary: 'bg-[var(--color-tertiary)] text-[var(--color-light-bg)] dark:text-[var(--color-dark-bg)] hover:opacity-75',
        quaternary: 'bg-[var(--color-quaternary)] text-[var(--color-light-bg)] dark:text-[var(--color-dark-bg)] hover:opacity-75',
        white: 'bg-[var(--color-white)] text-[var(--color-dark-bg)] hover:opacity-75',
        primaryFaded: 'border-2 border-[var(--color-primary)] bg-[var(--color-primary-faded)] hover:opacity-75',
        secondaryFaded: 'border-2 border-[var(--color-secondary)] bg-[var(--color-secondary-faded)] hover:opacity-75',
        tertiaryFaded: 'border-2 border-[var(--color-tertiary)] bg-[var(--color-tertiary-faded)] hover:opacity-75',
        quaternaryFaded: 'border-2 border-[var(--color-quaternary)] bg-[var(--color-quaternary-faded)] hover:opacity-75',
        gradient: 'bg-gradient-to-r from-[var(--color-tertiary)] to-[var(--color-secondary)] text-[var(--color-light-bg)] dark:text-[var(--color-dark-bg)] hover:opacity-75',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
