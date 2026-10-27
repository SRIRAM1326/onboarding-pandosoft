"use client";

import { Check } from "lucide-react";
import { cn } from "cn";
import { SECTION_LABELS } from "@/lib/constants/labels";
import type { SectionKey } from "@/lib/types";

const steps: SectionKey[] = ["business", "signatory", "ubo", "financial", "wallets", "declarations", "review"];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isComplete = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium",
                    isComplete && "border-success bg-success text-white",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    !isComplete && !isCurrent && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : stepNum}
                </div>
                <p className={cn("mt-2 text-xs text-center max-w-20", isCurrent ? "font-medium" : "text-muted-foreground")}>
                  {SECTION_LABELS[step]}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-2", isComplete ? "bg-success" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
