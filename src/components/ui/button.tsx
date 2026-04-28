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
  variant?: "primary" | "ghost";
  asChild?: boolean;
  children?: ReactNode;
  className?: string;
};

type ButtonProps =
  | (CommonProps & { asChild?: false | undefined } & ComponentPropsWithoutRef<"button">)
  | (CommonProps & { asChild: true; children: ReactElement });

export function Button(props: ButtonProps) {
  const { variant = "primary", asChild, className, children, ...rest } = props;

  const base =
    "inline-flex h-11 items-center justify-center gap-1.5 rounded-md px-5 text-[15px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40";

  const variants: Record<NonNullable<CommonProps["variant"]>, string> = {
    primary:
      "bg-green text-green-fg hover:bg-green-hover",
    ghost:
      "bg-transparent text-subtle hover:text-fg",
  };

  const classes = cn(base, variants[variant], className);

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) throw new Error("asChild kräver ett React-element.");
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
