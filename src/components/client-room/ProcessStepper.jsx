import React from 'react';
import { Check } from 'lucide-react';

export default function ProcessStepper({ stages, currentStage }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0">
      {stages.map((stage, index) => {
        const stageNumber = index + 1;
        const isCompleted = stageNumber < currentStage;
        const isActive = stageNumber === currentStage;

        return (
          <React.Fragment key={stage.stage_number}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isActive ? 'bg-blue-500 border-blue-500 text-white' : ''}
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-gray-100 border-gray-300 text-gray-500' : ''}
                `}
              >
                {isCompleted ? <Check className="h-6 w-6" /> : <span>{stage.stage_number}</span>}
              </div>
              <div className={`mt-2 text-center w-32 ${isActive ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                {stage.name}
              </div>
            </div>

            {index < stages.length - 1 && (
              <div className={`w-px h-8 md:w-full md:h-px flex-1 mx-4 my-2 md:my-0
                ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
              `}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}