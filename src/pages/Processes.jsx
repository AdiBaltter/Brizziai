
import React, { useState, useEffect } from "react";
import { Process } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton }
  from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProcessList from "../components/processes/ProcessList";
import ProcessCanvasBuilder from "../components/processes/ProcessCanvasBuilder";

import { useSecureEntityList } from '@/components/shared/useSecureEntityOperations';
import { SecureEntityOperations } from '@/components/shared/secureEntityOperations';

export default function ProcessesPage() {
  const [view, setView] = useState('list'); // 'list' or 'builder'
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  // State for delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [processToDelete, setProcessToDelete] = useState(null);

  const {
    data: allProcesses,
    loading,
    error,
    reload: loadProcesses
  } = useSecureEntityList(Process, "-created_date");

  // הוספת בדיקת שגיאה והצגת הודעה מתאימה
  useEffect(() => {
    if (error) {
      console.error("Error loading processes:", error);
    }
  }, [error]);

  const activeProcesses = allProcesses.filter(p => p.is_active);
  const inactiveProcesses = allProcesses.filter(p => !p.is_active);

  const processesToDisplay = activeTab === 'active' ? activeProcesses : inactiveProcesses;

  const handleEditProcess = (process) => {
    setSelectedProcess(process);
    setView('builder');
  };

  const handleDuplicateProcess = async (process) => {
    try {
      const secureOps = new SecureEntityOperations(Process);
      const { id, created_date, updated_date, ...processData } = process;

      const duplicatedProcess = {
        ...processData,
        name: `${process.name} - עותק`,
        is_active: false, // Duplicated processes are inactive by default
      };

      const newProcess = await secureOps.secureCreate(duplicatedProcess);
      
      // פתיחת חלון עריכה עבור התהליך המשוכפל
      setSelectedProcess(newProcess);
      setView('builder');
    } catch(e) {
      console.error("Failed to duplicate process", e);
      alert("שגיאה בשכפול התהליך.");
    }
  };

  const handleCreateNew = () => {
    setSelectedProcess(null);
    setView('builder');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedProcess(null);
    loadProcesses(); // Refresh list after editing/creating/deleting
  };

  const handleDeleteProcess = (process) => {
    setProcessToDelete(process);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProcess = async () => {
    if (processToDelete) {
      try {
        const secureOps = new SecureEntityOperations(Process);
        await secureOps.secureDelete(processToDelete.id);
        loadProcesses(); // Refresh the list after successful deletion
        alert('התהליך נמחק בהצלחה');
      } catch (error) {
        console.error("Error deleting process:", error);
        // הצגת הודעת שגיאה ידידותית למשתמש
        const errorMessage = error.message || "שגיאה לא ידועה";
        alert(`שגיאה במחיקת התהליך: ${errorMessage}`);
      } finally {
        setShowDeleteConfirm(false);
        setProcessToDelete(null);
      }
    }
  };

  const cancelDeleteProcess = () => {
    setShowDeleteConfirm(false);
    setProcessToDelete(null);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">שגיאה בטעינת נתונים</h2>
          <p className="text-gray-600 mb-4">
            אירעה שגיאה בטעינת רשימת התהליכים.
          </p>
          <Button onClick={loadProcesses}>
            <RefreshCw className="h-4 w-4 ml-2" />
            נסה שוב
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {view === 'list' ? (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ניהול תהליכים</h1>
              <p className="text-gray-600 mt-1">בנה תהליכי עבודה אוטומטיים עבור הלקוחות שלך.</p>
            </div>
            <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 ml-2" />
              בנה תהליך חדש
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="flex justify-end bg-transparent">
              <TabsTrigger value="inactive">לא פעילים ({inactiveProcesses.length})</TabsTrigger>
              <TabsTrigger value="active">פעילים ({activeProcesses.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <ProcessList
              processes={processesToDisplay}
              onEdit={handleEditProcess}
              onUpdate={loadProcesses}
              onDelete={handleDeleteProcess}
              onDuplicate={handleDuplicateProcess}
            />
          )}
        </div>
      ) : (
        <ProcessCanvasBuilder process={selectedProcess} onBack={handleBackToList} />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && processToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={cancelDeleteProcess}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>מחיקת תהליך</DialogTitle>
              <DialogDescription>
                האם אתה בטוח שברצונך למחוק את התהליך "{processToDelete.name}"? פעולה זו אינה הפיכה.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelDeleteProcess}>
                ביטול
              </Button>
              <Button variant="destructive" onClick={confirmDeleteProcess}>
                מחק
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
