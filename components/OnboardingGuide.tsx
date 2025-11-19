import React, { useLayoutEffect, useState, CSSProperties, useEffect } from 'react';

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
  
  // Lock body interaction globally when tour is active
  useEffect(() => {
      document.body.classList.add('tour-active');
      return () => {
          document.body.classList.remove('tour-active');
      };
  }, []);

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
            
            // Add padding to highlight box
            const padding = 8;

            setHighlightBoxStyle({
                position: 'fixed',
                top: `${rect.top - padding}px`,
                left: `${rect.left - padding}px`,
                width: `${rect.width + (padding * 2)}px`,
                height: `${rect.height + (padding * 2)}px`,
                display: 'block'
            });
            
            // Tooltip Positioning Logic
            const newTooltipStyle: CSSProperties = {
                position: 'fixed',
                left: `${rect.left + rect.width / 2}px`,
                transform: 'translateX(-50%)',
                maxWidth: '320px',
                width: 'calc(100vw - 40px)',
                display: 'block'
            };
            
            const tooltipHeight = 160; 
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            if (spaceBelow > tooltipHeight + 20) {
                 newTooltipStyle.top = `${rect.bottom + 20}px`;
            } else if (spaceAbove > tooltipHeight + 20) {
                 newTooltipStyle.top = `${rect.top - tooltipHeight - 20}px`;
            } else {
                 // Fallback: center if tight
                 newTooltipStyle.top = '50%';
                 newTooltipStyle.left = '50%';
                 newTooltipStyle.transform = 'translate(-50%, -50%)';
            }

            // Edge detection correction
            if (rect.left < 150) { 
                newTooltipStyle.left = '20px';
                newTooltipStyle.transform = 'translateX(0)';
            } else if (rect.right > window.innerWidth - 150) { 
                newTooltipStyle.left = 'auto';
                newTooltipStyle.right = '20px';
                newTooltipStyle.transform = 'translateX(0)';
            }

            setTooltipStyle(newTooltipStyle);

        }, 350); 

      } else {
        // Retry if element not found immediately (e.g. during modal animation)
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
      {/* The Highlight Box creates the "Spotlight" effect via massive box-shadow in CSS */}
      {/* It allows clicks to pass through to the target element because of pointer-events configuration in CSS */}
      <div className="tour-highlight-box" style={highlightBoxStyle} />
      
      <div
        className="tour-tooltip bg-white rounded-xl shadow-2xl p-5 border border-gray-100 animate-fade-in"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between mb-2">
             <h3 className="font-bold text-lg text-gray-900">{currentStep.title}</h3>
             <span className="text-xs font-bold text-[#84A98C] bg-green-50 px-2 py-1 rounded-full">
                 {currentStepIndex + 1} / {steps.length}
             </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">{currentStep.content}</p>
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
            <button onClick={onComplete} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors px-2 py-1">
                SALTAR
            </button>
            <div className="flex space-x-3">
                {currentStepIndex > 0 && (
                    <button onClick={handlePrev} className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
                        Atrás
                    </button>
                )}
                <button onClick={handleNext} className="px-5 py-2 text-sm bg-[#84A98C] text-white rounded-lg hover:bg-[#73957a] font-bold shadow-md shadow-green-900/10 transition-transform active:scale-95">
                    {currentStepIndex === steps.length - 1 ? '¡Listo!' : 'Siguiente'}
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingGuide;