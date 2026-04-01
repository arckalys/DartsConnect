"use client";

interface Step {
  label: string;
  name: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
}

export default function StepForm({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center mb-10">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <div key={i} className="contents">
            <div className="flex items-center gap-2 sm:gap-[10px] flex-1 last:flex-none">
              {/* Step number */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-barlow-condensed font-extrabold text-[0.85rem] sm:text-[0.95rem] shrink-0 border-2 transition-all duration-300 ${
                  isDone
                    ? "bg-[rgba(34,197,94,0.15)] border-[#22c55e] text-[#22c55e]"
                    : isActive
                    ? "bg-[#e8220a] border-[#e8220a] text-white shadow-[0_0_16px_rgba(232,34,10,0.3)]"
                    : "bg-[#111] border-[rgba(255,255,255,0.08)] text-[#777]"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>
              {/* Step info - hidden on very small screens */}
              <div className="hidden sm:flex flex-col">
                <div className={`text-[0.72rem] font-bold uppercase tracking-[1px] ${isActive ? "text-white" : "text-[#777]"}`}>
                  Étape {stepNum}/{steps.length}
                </div>
                <div className="text-[0.82rem] text-[#777]">{step.name}</div>
              </div>
            </div>
            {/* Line between steps */}
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 sm:mx-3 transition-colors duration-300 ${isDone ? "bg-[#22c55e]" : "bg-[rgba(255,255,255,0.08)]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
