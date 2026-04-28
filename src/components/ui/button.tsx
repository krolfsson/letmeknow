import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type CommonProps = {
  variant?: "primary" | "secondary" | "ghost";
  asChild?: boolean;
  children?: ReactNode;
  className?: string;
};

type ButtonProps =
  | (CommonProps & {
      asChild?: false | undefined;
    } & ComponentPropsWithoutRef<"button">)
  | (CommonProps & {
      asChild: true;
      children: ReactElement;
    });

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    asChild,
    className,
    children,
    ...rest
  } = props;

  const base =
    "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";
  const variants: Record<NonNullable<CommonProps["variant"]>, string> = {
    primary:
      "bg-accent text-accent-foreground shadow-[0_1px_2px_rgb(0_0_0/0.06)] hover:bg-accent-hover hover:brightness-[1.03] dark:shadow-[0_1px_2px_rgb(0_0_0/0.25)] dark:hover:brightness-105",
    secondary:
      "border border-border-brand bg-surface text-foreground hover:bg-surface-subtle dark:border-[rgb(238_241_238/0.12)]",
    ghost:
      "bg-transparent text-foreground hover:bg-surface-subtle/80 dark:hover:bg-[rgb(238_241_238/0.06)]",
  };

  const classes = cn(base, variants[variant], className);

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) {
      throw new Error(
        'Button med asChild kräver exakt ett React-element som barn.',
      );
    }
    const prev = child.props as { className?: string };
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      ...(child.props as Record<string, unknown>),
      className: cn(classes, prev.className),
    });
  }

  return (
    <button className={classes} {...(rest as ComponentPropsWithoutRef<"button">)}>
      {children}
    </button>
  );
}
