const LOGO_EXISTS = false;

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showFallback?: boolean;
}

export function BrandLogo({ size = "md", showFallback = !LOGO_EXISTS }: BrandLogoProps) {
  const heights = { sm: 28, md: 36, lg: 64 };
  const textSizes = { sm: "text-sm", md: "text-[15px]", lg: "text-4xl" };
  const subSizes = { sm: "text-[8px]", md: "text-[10px]", lg: "text-sm" };
  const iconSizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-16 h-16 text-2xl" };

  const h = heights[size];

  if (!showFallback) {
    return (
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/simex-logo.svg" alt="SIMEX" height={h} style={{ height: `${h}px`, width: "auto" }} />
        <div>
          <div className={`font-bold ${textSizes[size]} text-white leading-none`}>HidroCalc</div>
          <div className={`${subSizes[size]} text-gray-300 tracking-[.08em]`}>by SIMEX</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${iconSizes[size]} bg-white/20 rounded-md flex items-center justify-center text-white font-bold`}>
        S
      </div>
      <div>
        <div className={`font-bold ${textSizes[size]} text-white leading-none`}>HidroCalc</div>
        <div className={`${subSizes[size]} text-gray-300 tracking-[.08em]`}>by SIMEX</div>
      </div>
    </div>
  );
}
