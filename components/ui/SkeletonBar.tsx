type SkeletonBarProps = {
  className?: string;
};

export function SkeletonBar({ className = "" }: SkeletonBarProps) {
  return (
    <div
      aria-hidden
      className={`overflow-hidden rounded-md ${className}`}
      style={{
        backgroundColor: "#cbd5e1",
        backgroundImage:
          "linear-gradient(90deg, #cbd5e1 0%, #e2e8f0 42%, #ffffff 50%, #e2e8f0 58%, #cbd5e1 100%)",
        backgroundSize: "200% 100%",
        animation: "dashboard-card-shimmer 1.1s linear infinite",
      }}
    />
  );
}
