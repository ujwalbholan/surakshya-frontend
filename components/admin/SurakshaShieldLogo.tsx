interface SurakshaShieldLogoProps {
  size?: number
  className?: string
}

export default function SurakshaShieldLogo({ size = 48, className }: SurakshaShieldLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Suraksha shield logo"
    >
      <path
        d="M24 2L6 10V22C6 33.046 13.954 43.046 24 46C34.046 43.046 42 33.046 42 22V10L24 2Z"
        fill="#C0392B"
        stroke="#C0392B"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 8L12 14V22C12 29.732 17.268 36.732 24 39C30.732 36.732 36 29.732 36 22V14L24 8Z"
        fill="#000000"
        fillOpacity="0.3"
      />
      <path
        d="M24 14L18 17V22C18 25.866 20.686 29.314 24 30.5C27.314 29.314 30 25.866 30 22V17L24 14Z"
        fill="#FFFFFF"
        fillOpacity="0.9"
      />
      <circle cx="24" cy="22" r="3" fill="#C0392B" />
    </svg>
  )
}
