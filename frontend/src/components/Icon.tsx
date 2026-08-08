import type { JSX } from "preact";

export type IconName = "leaf" | "plus" | "save" | "copy" | "raw" | "eye" | "code" | "external" | "close";

interface IconProps {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 16 }: IconProps): JSX.Element {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "leaf":
      return <svg {...common}><path d="M20 4C12 4 6 7 4 13c-1 3 1 6 4 7 4 1 8-2 9-6" /><path d="M4 20c3-5 7-8 13-10" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "save":
      return <svg {...common}><path d="M5 4h12l2 2v14H5z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></svg>;
    case "copy":
      return <svg {...common}><rect x="8" y="8" width="11" height="12" rx="1" /><path d="M16 8V5H5v12h3" /></svg>;
    case "raw":
      return <svg {...common}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" /></svg>;
    case "eye":
      return <svg {...common}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
    case "code":
      return <svg {...common}><path d="m8 8-4 4 4 4M16 8l4 4-4 4" /></svg>;
    case "external":
      return <svg {...common}><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
    case "close":
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  }
}
