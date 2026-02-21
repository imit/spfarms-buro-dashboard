import Avatar from "boring-avatars"

const STRAIN_COLORS = ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface StrainAvatarProps {
  name: string
  size?: number
}

export function StrainAvatar({ name, size = 24 }: StrainAvatarProps) {
  const initials = getInitials(name)
  const fontSize = size * 0.4

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Avatar name={name} variant="marble" size={size} colors={STRAIN_COLORS} />
      <span
        className="absolute inset-0 flex items-center justify-center font-semibold text-white"
        style={{ fontSize, lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
      >
        {initials}
      </span>
    </div>
  )
}
