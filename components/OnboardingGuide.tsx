import React, { useLayoutEffect, useState, CSSProperties } from 'react';

export interface TourStep {
  selector: string;
  title: string;
  content: string;
  before?: () => void; // Action to run before the step is shown
  after?: () => void;  // Action to run after clicking "Next" on this step
}

interface OnboardingGuideProps {
  steps: TourStep[];
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  onComplete: () => void;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ steps, currentStepIndex, setCurrentStepIndex, onComplete }) => {
  const [highlightBoxStyle, setHighlightBoxStyle] = useState<CSSProperties>({ display: 'none' });
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({ display: 'none' });

  const currentStep = steps[currentStepIndex];

  useLayoutEffect(() => {
    if (!currentStep) return;

    currentStep.before?.();

    const findElementAndPosition = () => {
      const element = document.querySelector(currentStep.selector) as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        // Use a timeout to wait for scroll to finish before getting rect
        setTimeout(() => {
            const rect = element.getBoundingClientRect();

            setHighlightBoxStyle({
                position: 'fixed',
                top: `${rect.top - 5}px`,
                left: `${rect.left - 5}px`,
                width: `${rect.width + 10}px`,
                height: `${rect.height + 10}px`,
            });
            
            // Tooltip Positioning
            const newTooltipStyle: CSSProperties = {
                position: 'fixed',
                left: `${rect.left + rect.width / 2}px`,
                transform: 'translateX(-50%)',
                maxWidth: '300px',
                width: 'calc(100vw - 40px)',
            };
            
            const tooltipHeight = 180; // Estimated height
            const spaceBelow = window.innerHeight - rect.bottom;
            
            if (spaceBelow > tooltipHeight + 20) {
                 newTooltipStyle.top = `${rect.bottom + 15}px`;
            } else {
                 newTooltipStyle.top = `${rect.top - tooltipHeight - 15}px`;
            }

            // Adjust horizontal position if tooltip goes off-screen
            if (rect.left < 150) { // If target is on the far left
                newTooltipStyle.left = '20px';
                newTooltipStyle.transform = 'translateX(0)';
            }
            if (rect.right > window.innerWidth - 150) { // If target is on the far right
                newTooltipStyle.left = 'auto';
                newTooltipStyle.right = '20px';
                newTooltipStyle.transform = 'translateX(0)';
            }

            setTooltipStyle(newTooltipStyle);

        }, 300); // Delay to allow smooth scrolling to settle

      } else {
        setTimeout(findElementAndPosition, 100);
      }
    };

    const timer = setTimeout(findElementAndPosition, 50);
    return () => clearTimeout(timer);

  }, [currentStepIndex, currentStep]);

  const handleNext = () => {
    currentStep?.after?.();
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (!currentStep) return null;

  return (
    <>
      <div className="tour-overlay"></div>
      <div className="tour-highlight-box" style={highlightBoxStyle} />
      <div
        className="tour-tooltip bg-white rounded-lg shadow-2xl p-4"
        style={tooltipStyle}
      >
        <h3 className="font-bold text-lg mb-2">{currentStep.title}</h3>
        <p className="text-sm text-gray-700">{currentStep.content}</p>
        <div className="flex justify-between items-center mt-4">
            <button onClick={onComplete} className="text-xs text-gray-500 hover:text-gray-800">Saltar Guía</button>
            <div className="space-x-2">
                {currentStepIndex > 0 && (
                    <button onClick={handlePrev} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
                        Anterior
                    </button>
                )}
                <button onClick={handleNext} className="px-3 py-1.5 text-sm bg-[#84A98C] text-white rounded-md hover:bg-[#73957a] font-semibold">
                    {currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingGuide;