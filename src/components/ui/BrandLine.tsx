import { cn } from "@/lib/utils";

interface BrandLineProps {
  className?: string;
}

export function BrandLine({ className }: BrandLineProps) {
  return (
    <div className={cn("brand-line", className)}>
      <div className="brand-line-destructive" />
      <div className="brand-line-accent" />
      <div className="brand-line-primary" />
    </div>
  );
}
