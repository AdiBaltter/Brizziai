import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Check, Circle, Radio } from 'lucide-react';

export default function PortalProcessTab({ process, client }) {
    if (!process || !process.stages) {
        return <Card><CardContent className="p-8 text-center text-gray-500">עדיין לא הוגדר תהליך עבורך.</CardContent></Card>
    }

    const visibleStages = process.stages.filter(s => s.visibility === 'external');
    const currentStage = client.current_stage || 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{process.name}</CardTitle>
                <CardDescription>{process.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative border-r-2 border-gray-200 ml-3">
                    {visibleStages.map((stage, index) => {
                         const stageNumber = index + 1;
                         const isCompleted = stageNumber < currentStage;
                         const isCurrent = stageNumber === currentStage;

                        return (
                            <div key={index} className="mb-8 ml-6">
                                <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -right-3 ring-4 ring-white
                                    ${isCurrent ? 'bg-blue-200 text-blue-800' : isCompleted ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                    {isCompleted ? <Check className="w-4 h-4" /> : isCurrent ? <Radio className="w-4 h-4 animate-pulse" /> : <Circle className="w-3 h-3"/> }
                                </span>
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{stage.message_template}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}