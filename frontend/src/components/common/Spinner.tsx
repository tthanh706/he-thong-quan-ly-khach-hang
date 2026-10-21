export default function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div className="spinner-wrap">
      <svg width={size} height={size} viewBox="0 0 24 24" className="spinner-svg">
        <circle cx="12" cy="12" r="10" strokeWidth="3" />
      </svg>
    </div>
  );
}
