export default function StatusBadge({ value }) {
  return (
    <span
      className={`pill ${(value || '').toLowerCase().replaceAll(' ', '-')}`}
    >
      {value}
    </span>
  );
}
