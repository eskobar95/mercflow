import * as SelectPrimitive from "@radix-ui/react-select"
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

import { IconCheck, IconChevronDown } from "@/components/ui/icons"
import { cn } from "@/lib/cn"

import { fieldClassName } from "./formStyles"

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  disabled?: boolean
  error?: boolean
  id?: string
  name?: string
  "aria-label"?: string
  className?: string
  triggerClassName?: string
}

/**
 * Radix Select with MercFlow token styling.
 */
export function Select({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  options,
  disabled = false,
  error = false,
  id,
  name,
  "aria-label": ariaLabel,
  className,
  triggerClassName,
}: SelectProps): JSX.Element {
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          fieldClassName({ error, className: triggerClassName }),
          "inline-flex items-center justify-between gap-2 text-left",
          "data-[placeholder]:text-content-tertiary",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="text-content-tertiary">
          <IconChevronDown size={14} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "z-dropdown overflow-hidden rounded-md border border-border-default bg-surface-raised shadow-md",
            className,
          )}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

const SelectItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { children: ReactNode }
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex min-h-11 cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm text-content-primary outline-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[highlighted]:bg-surface-subtle",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <IconCheck size={14} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
