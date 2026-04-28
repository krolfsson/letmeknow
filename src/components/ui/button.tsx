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
  variant?: "primary" | "secondary";
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
    "inline-flex h-12 min-w-[9.5rem] flex-1 items-center justify-center gap-1.5 rounded-lg px-5 text-[15px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 sm:min-w-[11rem] sm:flex-initial";

  const variants: Record<NonNullable<CommonProps["variant"]>, string> = {
    primary: "bg-green text-green-fg shadow-sm hover:bg-green-hover",
    secondary:
      "border-2 border-green bg-green-mist/80 text-green-deep hover:bg-green-soft/50 dark:bg-green-mist/30 dark:text-green dark:hover:bg-green-soft/20",
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
