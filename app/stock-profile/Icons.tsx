import type { SVGProps } from "react";

type IconName = "back" | "close" | "camera" | "mail" | "user" | "at" | "key" | "bag" | "store" | "logout";
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {name === "back" && <path d="m15 18-6-6 6-6" />}
      {name === "close" && <path d="m6 6 12 12M6 18 18 6" />}
      {name === "mail" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>}
      {name === "user" && <><circle cx="12" cy="8" r="4" /><path d="M4 22v-2a8 8 0 0 1 16 0v2" /></>}
      {name === "at" && <><circle cx="12" cy="12" r="3.5" /><path d="M15.5 8.5v6a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-4 7.2" /></>}
      {name === "camera" && <><path d="M8 5 9 3h6l1 2h3a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2z" /><circle cx="12" cy="12" r="4" /></>}
      {name === "key" && <><circle cx="16" cy="8" r="5" /><path d="m12.5 11.5-9 9M7 17l-3-3M10 14l-3-3" /></>}
      {name === "bag" && <><path d="M5 8h14l1 13H4L5 8Z" fill="currentColor" stroke="none" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>}
      {name === "store" && <><path d="M4 10v11h16V10M3 6l2-3h14l2 3v4a3 3 0 0 1-4 0 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-4 0V6ZM3 6h18M9 21v-7h6v7" /></>}
      {name === "logout" && <><path d="M10 4H4v16h6M9 12h12m-4-4 4 4-4 4" /></>}
    </svg>
  );
}
