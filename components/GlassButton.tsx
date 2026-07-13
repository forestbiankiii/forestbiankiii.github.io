"use client";

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import StudioLiquidGlass from "@/components/StudioLiquidGlass";
import "./GlassButton.css";

type CommonProps = {
  children: ReactNode;
  className?: string;
  surfaceClassName?: string;
  icon?: boolean;
};

type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className"> & {
    href: string;
  };

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: never;
  };

type GlassButtonProps = LinkProps | ButtonProps;

export default function GlassButton({
  children,
  className = "",
  surfaceClassName = "",
  icon = false,
  ...props
}: GlassButtonProps) {
  const controlClassName = `glass-button-control ${className}`.trim();

  const control =
    "href" in props && typeof props.href === "string" ? (
      <a
        {...(props as Omit<LinkProps, keyof CommonProps>)}
        className={controlClassName}
      >
        {children}
      </a>
    ) : (
      <button
        {...(props as Omit<ButtonProps, keyof CommonProps>)}
        type={(props as ButtonProps).type ?? "button"}
        className={controlClassName}
      >
        {children}
      </button>
    );

  return (
    <StudioLiquidGlass
      width={icon ? "2.75rem" : "fit-content"}
      height={icon ? "2.75rem" : "auto"}
      borderRadius={999}
      capturePad={48}
      captureReadable
      shaderHalo={false}
      className={`glass-button-surface ${
        icon ? "glass-button-surface--icon" : ""
      } ${surfaceClassName}`.trim()}
    >
      {control}
    </StudioLiquidGlass>
  );
}
