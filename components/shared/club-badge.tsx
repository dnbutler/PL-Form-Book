type ClubBadgeProps = {
  name: string;
  shortName?: string | null;
  crestUrl?: string | null;
  size?: number;
};

export function ClubBadge({ name, shortName, crestUrl, size = 28 }: ClubBadgeProps) {
  if (crestUrl) {
    return (
      <img
        src={crestUrl}
        alt={`${name} crest`}
        width={size}
        height={size}
        className="club-badge"
      />
    );
  }

  return (
    <span
      className="club-badge club-badge-fallback"
      aria-label={`${name} crest fallback`}
      style={{ width: size, height: size }}
    >
      {(shortName ?? name).slice(0, 3).toUpperCase()}
    </span>
  );
}
