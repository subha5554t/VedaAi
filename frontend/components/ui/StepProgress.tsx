import React from 'react';
import { cn } from '@/lib/utils';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-300',
            index < currentStep ? 'bg-[#E8520A]' : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  );
}
