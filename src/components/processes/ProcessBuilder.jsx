
import React, { useState, useEffect } from 'react';
import { Process } from '@/api/entities';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Save, ArrowLeft, GripVertical, Trash2 } from 'lucide-react';
import EditStagePanel from './EditStagePanel';

function StageRow({ stage, provided, onUpdate, onSelect, isSelected }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(stage.name);

    // Update local name when stage prop changes
    useEffect(() => {
        setName(stage.name);
    }, [stage.name]);

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleNameBlur = () => {
        setIsEditingName(false);
        if (name !== stage.name) { // Only update if changed
            onUpdate(stage.id, 'name', name);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleNameBlur();
        }
        if (e.key === 'Escape') {
            setName(stage.name); // Reset to original name
            setIsEditingName(false);
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation(); // Prevent selecting the stage
        setIsEditingName(true);
    };

    return (
        <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`group flex items-center p-3 rounded-lg cursor-pointer border transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
            onClick={() => onSelect(stage.id)}
        >
            <div {...provided.dragHandleProps} className="p-1 text-gray-400 hover:text-gray-600 mr-2">
                <GripVertical className="h-5 w-5" />
            </div>
            
            <div className="flex-1">
                {isEditingName ? (
                    <Input
                        value={name}
                        onChange={handleNameChange}
                        onBlur={handleNameBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 flex-1">{stage.name}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={handleEditClick}
                        >
                            ✏️
                        </Button>
                    </div>
                )}
            </div>
            
            {stage.visibility === 'internal' && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full mr-2">פנימי</span>
            )}
        </div>
    );
}

export default function ProcessBuilder({ process, onBack }) {
  const [currentProcess, setCurrentProcess] = useState(process || { name: 'תהליך חדש', stages: [] });
  const [stages, setStages] = useState(process ? process.stages || [] : []);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (process) {
      setCurrentProcess(process);
      setStages(process.stages || []);
      // Removed auto-selection of first stage
    }
  }, [process]);

  const handleUpdateStage = (stageId, field, value) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, [field]: value } : s));
  };
  
  const handleAddStage = () => {
    const newStage = {
      id: `new-${Date.now()}`,
      name: `שלב חדש`,
      description: '',
      timing_preset: '1_day',
      timing_custom_value: 1,
      timing_custom_unit: 'days',
      action: 'send_message',
      action_config: { message_template: '' },
      requires_approval: false,
      visibility: 'external',
    };
    const newStages = [...stages, newStage];
    setStages(newStages);
    // Removed auto-selection of new stage
  };

  const handleRemoveStage = (stageId) => {
    setStages(prev => prev.filter(s => s.id !== stageId));
    if (selectedStageId === stageId) {
      setSelectedStageId(null); // Deselect if the removed stage was selected
    }
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    setStages(items);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const finalProcess = { ...currentProcess, stages };
    try {
      if (finalProcess.id) {
        await Process.update(finalProcess.id, finalProcess);
      } else {
        await Process.create(finalProcess);
      }
      onBack();
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setIsSaving(false);
    }
  };
  
  const selectedStage = stages.find(s => s.id === selectedStageId);
  const progress = stages.length > 0 ? (stages.findIndex(s => s.id === selectedStageId) + 1) / stages.length * 100 : 0;

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Left Panel: Stages List */}
      <div className="w-1/3 min-w-[350px] bg-white border-l p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
            <Input 
                className="text-xl font-bold p-2 h-auto"
                value={currentProcess.name}
                onChange={e => setCurrentProcess(p => ({...p, name: e.target.value}))}
            />
        </div>
        <div className="mb-4">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-gray-500 mt-1 text-center">{stages.length} שלבים</p>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="stages-list">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                            {stages.map((stage, index) => (
                                <Draggable key={stage.id} draggableId={String(stage.id)} index={index}>
                                    {(provided) => (
                                       <StageRow 
                                            stage={stage}
                                            provided={provided}
                                            onUpdate={handleUpdateStage}
                                            onSelect={setSelectedStageId}
                                            isSelected={selectedStageId === stage.id}
                                       />
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
        
        <div className="mt-4 pt-4 border-t">
             <Button variant="outline" className="w-full" onClick={handleAddStage}><Plus className="h-4 w-4 ml-2" /> הוסף שלב</Button>
        </div>
      </div>

      {/* Right Panel: Edit Stage */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedStage ? (
            <EditStagePanel 
                key={selectedStage.id}
                stage={selectedStage}
                onUpdate={handleUpdateStage}
                onDelete={handleRemoveStage}
                onClose={() => setSelectedStageId(null)}
            />
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>בחר שלב לעריכה או הוסף שלב חדש.</p>
            </div>
        )}
      </div>
      
      {/* Footer Save Button */}
       <div className="absolute bottom-6 left-6">
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="shadow-lg">
              <Save className="h-4 w-4 ml-2" />
              {isSaving ? 'שומר...' : 'שמור תהליך'}
          </Button>
      </div>
    </div>
  );
}
