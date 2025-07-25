import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Client } from "@/api/entities";
import ProcessStepper from "./ProcessStepper";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function ProcessTab({ client, process, onUpdate }) {
  const [loading, setLoading] = useState(false);
  
  if (!process) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <p>לא הוגדר תהליך עבור סוג הלקוח הזה.</p>
        </CardContent>
      </Card>
    );
  }

  const handleAdvanceStage = async () => {
    const currentStage = client.current_stage || 1;
    const nextStage = currentStage + 1;
    if (nextStage > process.stages.length) return;

    setLoading(true);
    try {
      await Client.update(client.id, { current_stage: nextStage });
      onUpdate();
    } catch(e) {
      console.error("Failed to advance stage:", e);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = (client.current_stage || 1) > process.stages.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{process.name}</CardTitle>
        <p className="text-sm text-gray-500">{process.description}</p>
      </CardHeader>
      <CardContent>
        {isCompleted ? (
            <div className="text-center py-10 text-green-600">
                <CheckCircle className="h-12 w-12 mx-auto mb-3" />
                <h3 className="text-xl font-bold">התהליך הושלם!</h3>
            </div>
        ) : (
            <>
                <ProcessStepper stages={process.stages} currentStage={client.current_stage || 1} />
                <div className="mt-8 flex justify-end">
                    <Button onClick={handleAdvanceStage} disabled={loading}>
                        {loading ? "מעדכן..." : "העבר לשלב הבא"}
                        <ArrowLeft className="h-4 w-4 mr-2" />
                    </Button>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}