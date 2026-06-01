import type { ReactNode, SVGProps } from "react";

export type SidebarIconName =
  | "chart"
  | "users"
  | "lead"
  | "folder"
  | "grid"
  | "wallet"
  | "building"
  | "sale"
  | "profile";

type SidebarIconProps = SVGProps<SVGSVGElement> & {
  name: SidebarIconName;
};

const iconPaths: Record<SidebarIconName, ReactNode> = {
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-7" />
    </>
  ),
  users: (
    <>
      <path d="M16 19c0-2.2-1.8-4-4-4H7c-2.2 0-4 1.8-4 4" />
      <path d="M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M21 19c0-1.9-1.3-3.4-3.1-3.9" />
      <path d="M16.5 5.2a3 3 0 0 1 0 5.6" />
    </>
  ),
  lead: (
    <>
      <path d="M5 5h14v14H5z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
      <path d="M16 16l3 3" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M3 7V6a2 2 0 0 1 2-2h4l2 3" />
    </>
  ),
  grid: (
    <>
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v6h-6z" />
      <path d="M4 14h6v6H4z" />
      <path d="M14 14h6v6h-6z" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7h16v12H4z" />
      <path d="M4 7l3-4h10l3 4" />
      <path d="M15 13h3" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h10v18" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M8 7h4" />
      <path d="M8 11h4" />
      <path d="M8 15h4" />
    </>
  ),
  sale: (
    <>
      <path d="M20 12V7H4v10a2 2 0 0 0 2 2h8" />
      <path d="M4 7l3-4h10l3 4" />
      <path d="M16 18l2 2 4-5" />
    </>
  ),
  profile: (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
};

export function SidebarIcon({ name, ...props }: SidebarIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}
