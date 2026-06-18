import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "ghost" | "primary";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  variant?: Variant;
  children: ReactNode;
}

export default function IconButton({
  label,
  active = false,
  variant = "ghost",
  disabled = false,
  className = "",
  children,
  ...rest
}: IconButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-40 disabled:pointer-events-none";

  const variantClass =
    variant === "primary"
      ? "h-9 w-9 bg-primary text-bg-base hover:scale-105 transition-transform"
      : [
          "h-8 w-8",
          active
            ? "text-accent"
            : "text-secondary hover:text-primary hover:bg-bg-hover",
        ].join(" ");

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={`${base} ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
