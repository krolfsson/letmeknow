import type React from "react";
import { cn } from "@/lib/cn";

export function Container({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl px-6", className)} {...props} />
  );
}
