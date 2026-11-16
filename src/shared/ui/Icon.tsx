import type { ReactNode } from 'react'

const paths = {
  search: <><circle cx="10.8" cy="10.8" r="7.5" /><path d="m16.3 16.3 4.4 4.4" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  sliders: <><path d="M3 6h7m4 0h7M3 12h12m4 0h2M3 18h3m4 0h11M10 3v6m5 0v6m-9 0v6" /></>,
  arrow: <><path d="M3 12h17m-7-8 8 8-8 8" /></>,
  plus: <path d="M12 4v16M4 12h16" />,
  check: <path d="m5 12 5 5L20 7" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.2" /></>,
  bell: <><path d="M5 10a7 7 0 0 1 14 0c0 7 3 7 3 9H2c0-2 3-2 3-9Zm5 12h4" /></>,
  box: <><path d="m12 8 9-5-9-5-9 5 9 5Z" transform="translate(0 5)" /><path d="m3 8-2 5 9 5 2-5 2 5 9-5-2-5M3 15v5l9 5 9-5v-5M12 18v7" transform="translate(0 -2)" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 2v6m10-6v6M3 11h18" /></>,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof paths

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
