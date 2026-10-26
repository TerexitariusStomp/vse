/** The VSE mark — many voices converging into one signal inside a ring. */
export function Mark({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path
        d="M8.5 8.5 16 23.5M16 8.5 16 23.5M23.5 8.5 16 23.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="23.5" r="2.4" fill="currentColor" />
    </svg>
  )
}
