import type { SVGProps } from "react";

type IconName = "back" | "close" | "camera" | "mail" | "user" | "key";
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {name === "back" && <path d="m15 18-6-6 6-6" />}
      {name === "close" && <path d="m6 6 12 12M6 18 18 6" />}
      {name === "mail" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>}
      {name === "user" && <><circle cx="12" cy="8" r="4" /><path d="M4 22v-2a8 8 0 0 1 16 0v2" /></>}
      {name === "camera" && <><path d="M8 5 9 3h6l1 2h3a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2z" /><circle cx="12" cy="12" r="4" /></>}
      {name === "key" && <><circle cx="16" cy="8" r="5" /><path d="m12.5 11.5-9 9M7 17l-3-3M10 14l-3-3" /></>}
    </svg>
  );
}
