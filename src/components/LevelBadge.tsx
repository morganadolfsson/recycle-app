interface Props {
  level: number;
  size?: 'sm' | 'md';
}

const STARS = ['\u2606', '\u2605'];

export default function LevelBadge({ level, size = 'md' }: Props) {
  return (
    <span className={`level-badge level-badge--${size}`} aria-label={`Level ${level}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < level ? 'level-badge__star--filled' : 'level-badge__star--empty'}>
          {STARS[i < level ? 1 : 0]}
        </span>
      ))}
    </span>
  );
}
