import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Renders a responsive table with consistent styling and horizontal overflow handling.
 *
 * Wraps a native HTML `<table>` element inside a container `<div>` to enable horizontal scrolling on overflow. Applies predefined styling classes and merges any additional class names provided.
 *
 * @param className - Optional additional CSS classes to apply to the table element.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

/**
 * Renders a styled table header section using a `<thead>` element.
 *
 * Applies a bottom border to all `<tr>` children and includes a `data-slot="table-header"` attribute for identification.
 */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

/**
 * Renders a styled table body (`<tbody>`) element with optional custom classes.
 *
 * Removes the border from the last table row and adds a `data-slot="table-body"` attribute for identification.
 */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

/**
 * Renders a styled table footer (`<tfoot>`) element with custom classes and a data attribute for slot identification.
 *
 * Applies a muted background, top border, medium font weight, and removes the bottom border from the last row.
 */
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a table row with styling for borders, hover effects, and selected state.
 *
 * Applies a background color on hover and when the `data-state="selected"` attribute is present. Additional props are spread onto the `<tr>` element.
 */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a styled table header cell (`<th>`) with consistent alignment, padding, and font styling.
 *
 * @remark
 * Applies special padding and vertical alignment adjustments for child elements with `role="checkbox"`.
 */
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a styled table cell (`<td>`) with consistent padding, alignment, and whitespace handling.
 *
 * @remark
 * If a child element with `role="checkbox"` is present, right padding is removed and the checkbox is vertically adjusted for alignment.
 */
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a styled table caption element with muted text and spacing.
 *
 * Adds a `data-slot="table-caption"` attribute for identification and merges custom classes with default styling.
 */
function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
