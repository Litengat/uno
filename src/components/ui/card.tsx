import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Renders a styled container for card UI elements.
 *
 * Combines base card styles with any additional classes and props, and sets a `data-slot="card"` attribute for identification.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the header section of a Card component with grid layout and responsive styling.
 *
 * Applies specific grid and spacing classes, and conditionally adjusts layout if a card action is present. Additional props are spread onto the root div.
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the title section of a card with emphasized styling.
 *
 * Displays its children inside a div with bold font and compact line height, suitable for use as a card title.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * Renders a styled container for a card's description text.
 *
 * Applies muted foreground color and smaller font size to its content. Additional classes and div props can be provided.
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * Renders a styled container for action elements within a card header.
 *
 * Positions its content in the top-right area of the card header grid layout.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the main content area of a card with horizontal padding.
 *
 * Additional props are spread onto the root div element.
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

/**
 * Renders the footer section of a Card component with horizontal padding and vertical centering.
 *
 * Additional classes can be merged via the {@link className} prop. Applies extra top padding if a top border is present.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
