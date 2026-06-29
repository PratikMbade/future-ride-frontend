import futurerideLogo from "@/assets/future-ride-logo.png";

export const FutureRideLogo = ({
  className = "h-8 w-8",
}: {
  className?: string;
}) => (
  <span
    className={`relative inline-flex items-center justify-center ${className}`}
  >
    <span
      aria-hidden="true"
      className="absolute inset-0 rounded-full bg-gold/20 blur-md"
    />
    <img
      src={futurerideLogo}
      alt="Future"
      className="relative h-full w-full object-contain drop-shadow-[0_0_10px_rgba(245,165,36,0.35)]"
      draggable={false}
    />
  </span>
);

export default FutureRideLogo;
