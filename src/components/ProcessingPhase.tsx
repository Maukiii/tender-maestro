import { Loader2 } from "lucide-react";

interface ProcessingPhaseProps {
  statusText: string;
  progress: number;
}

export function ProcessingPhase({ statusText, progress }: ProcessingPhaseProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-md">
        <p className="text-lg font-medium text-foreground animate-pulse-gentle">
          {statusText}
        </p>
        <p className="text-sm text-muted-foreground">
          Our AI agent is analyzing your tender document
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right mt-1.5">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
