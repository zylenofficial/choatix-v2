"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeValue: value,
            onValueChange,
          })
        }
        return child
      })}
    </div>
  )
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  activeValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

function TabsList({ className, children, activeValue, onValueChange }: TabsListProps) {
  return (
    <div
      className={cn(
        "flex border-b border-white/10",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeValue,
            onValueChange,
          })
        }
        return child
      })}
    </div>
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  activeValue?: string
  onValueChange?: (value: string) => void
}

function TabsTrigger({
  className,
  value,
  activeValue,
  onValueChange,
  children,
  ...props
}: TabsTriggerProps) {
  const isActive = activeValue === value
  return (
    <button
      className={cn(
        "flex-1 h-10 flex items-center justify-center gap-2 text-[11px] font-medium tracking-wider uppercase transition-colors duration-200 border-b-2",
        isActive
          ? "border-white text-white"
          : "border-transparent text-white/40 hover:text-white/70",
        className
      )}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  activeValue?: string
}

function TabsContent({ className, value, activeValue, children, ...props }: TabsContentProps) {
  if (activeValue !== value) return null
  return (
    <div className={cn("pt-4", className)} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
