interface StatProps {
  label: string;
  value: string;
  testId?: string;
}

/** Presentation only: receives a formatted string, performs no arithmetic. */
export function Stat({ label, value, testId }: StatProps) {
  return (
    <div className="stat">
      <small>{label}</small>
      <b data-testid={testId}>{value}</b>
    </div>
  );
}
