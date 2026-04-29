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
    "inline-flex h-12 min-w-[9.5rem] flex-1 items-center justify-center gap-1.5 rounded-xl px-5 text-[15px] font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-40 sm:min-w-[11rem] sm:flex-initial";

  const variants: Record<NonNullable<CommonProps["variant"]>, string> = {
    primary:
      "bg-emerald-500 text-white shadow-[0_8px_25px_rgba(16,185,129,0.30)] hover:scale-[1.01] hover:bg-emerald-600 hover:shadow-[0_12px_35px_rgba(16,185,129,0.42)]",
    secondary:
      "border border-gray-200 bg-white/70 text-gray-700 hover:border-emerald-500/25 hover:bg-white hover:text-gray-900",
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
