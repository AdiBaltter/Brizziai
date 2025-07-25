
import React, { useState, useRef } from 'react';
import { Document } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Trash2, Edit, Save, PlusCircle, Loader2, File, Eye, EyeOff, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DocumentsTab({ documents, entity, entityType, onUpdate }) {
  const [editingDoc, setEditingDoc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });

      const docData = {
        name: file.name.split('.').slice(0, -1).join('.'), // Name without extension
        file_url,
        file_type: file.type.split('/')[1]?.toUpperCase() || 'אחר',
        size: file.size,
        uploaded_by: 'בעל העסק',
        visibility: 'פנימי',
        account_id: entity.account_id,
        ...(entityType === 'client' ? { client_id: entity.id } : { lead_id: entity.id }),
      };

      await Document.create(docData);
      toast({ title: 'הצלחה', description: 'המסמך הועלה בהצלחה.' });
      onUpdate();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ variant: 'destructive', title: 'שגיאה', description: 'העלאת המסמך נכשלה.' });
    } finally {
      setIsUploading(false);
      event.target.value = null;
    }
  };
  
  const handleUpdateName = async () => {
    if (!editingDoc) return;
    try {
      await Document.update(editingDoc.id, { name: editingDoc.name });
      toast({ title: 'הצלחה', description: 'שם המסמך עודכן.' });
      setEditingDoc(null);
      onUpdate();
    } catch (error) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'עדכון שם המסמך נכשל.' });
    }
  };
  
  const handleVisibilityChange = async (doc, checked) => {
    const newVisibility = checked ? 'חיצוני' : 'פנימי';
    try {
      await Document.update(doc.id, { visibility: newVisibility });
      toast({ title: 'הצלחה', description: `נראות המסמך שונתה ל${newVisibility}.` });
      onUpdate();
    } catch (error) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'שינוי נראות המסמך נכשל.' });
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await Document.delete(docToDelete.id);
      toast({ title: 'הצלחה', description: 'המסמך נמחק.' });
      setDocToDelete(null);
      onUpdate();
    } catch (error) {
       toast({ variant: 'destructive', title: 'שגיאה', description: 'מחיקת המסמך נכשלה.' });
    }
  };

  const startEditing = (doc) => {
    setEditingDoc({ id: doc.id, name: doc.name });
  };

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ניהול מסמכים</CardTitle>
        <Button onClick={handleUploadClick} disabled={isUploading}>
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          <span className="mr-2">העלה מסמך</span>
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.length > 0 ? (
            documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                    <File className="h-6 w-6 text-gray-500" />
                    {editingDoc?.id === doc.id ? (
                        <Input 
                            value={editingDoc.name}
                            onChange={(e) => setEditingDoc({...editingDoc, name: e.target.value})}
                            className="h-9"
                        />
                    ) : (
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                                {format(new Date(doc.created_date), 'd MMM yyyy', { locale: he })}
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor={`vis-${doc.id}`} className="text-sm text-gray-600">גלוי ללקוח</label>
                    <Switch
                      id={`vis-${doc.id}`}
                      checked={doc.visibility === 'חיצוני'}
                      onCheckedChange={(checked) => handleVisibilityChange(doc, checked)}
                    />
                    {doc.visibility === 'חיצוני' ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingDoc?.id === doc.id ? (
                        <Button size="icon" variant="ghost" onClick={handleUpdateName}><Save className="h-4 w-4" /></Button>
                    ) : (
                        <Button size="icon" variant="ghost" onClick={() => startEditing(doc)}><Edit className="h-4 w-4" /></Button>
                    )}
                    <Button size="icon" variant="ghost" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4 text-blue-600" /></a>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDocToDelete(doc)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">אין מסמכים להצגה</p>
          )}
        </div>
      </CardContent>
       <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מסמך</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את המסמך "{docToDelete?.name}"? לא ניתן לשחזר פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
