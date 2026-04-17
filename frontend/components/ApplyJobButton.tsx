import { Button } from "@/components/ui/button";
import { enforceProfileCompletion } from "@/lib/profileEnforcement";

interface ApplyJobButtonProps {
  jobId: number;
  onApply?: (jobId: number) => void;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function ApplyJobButton({ 
  jobId, 
  onApply, 
  children = "Apply", 
  className,
  size = "sm" 
}: ApplyJobButtonProps) {
  const handleClick = async () => {
    const canApply = await enforceProfileCompletion();
    if (canApply && onApply) {
      onApply(jobId);
    }
  };

  return (
    <Button 
      onClick={handleClick}
      size={size}
      className={className}
    >
      {children}
    </Button>
  );
}