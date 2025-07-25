import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Document, Client } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Upload, Download, FileText, User, Building } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function PortalDocumentsTab({ client, documents, onUpdate }) {
  const [file, setFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleUpload = async () => {
    if (!file || !documentName) {
        alert('אנא בחר קובץ והזן שם למסמך.');
        return;
    }
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await Document.create({
        name: documentName,
        client_id: client.id,
        file_url: file_url,
        file_type: file.name.split('.').pop().toUpperCase(),
        uploaded_by: 'לקוח',
        visibility: 'חיצוני',
        size: file.size,
      });
      setFile(null);
      setDocumentName('');
      document.getElementById('portal-file-input').value = ''
      onUpdate();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
      if (filter === 'all') return true;
      return doc.uploaded_by === filter;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>העלאת מסמך חדש</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <Input 
                placeholder="שם המסמך (לדוגמה: תעודת זהות)"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
            />
            <Input id="portal-file-input" type="file" onChange={(e) => setFile(e.target.files[0])} />
            <Button onClick={handleUpload} disabled={uploading}>
                <Upload className="ml-2 h-4 w-4" />
                {uploading ? 'מעלה...' : 'העלה'}
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>מאגר המסמכים</CardTitle>
                <div className="flex gap-2">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>הכל</Button>
                    <Button variant={filter === 'בעל העסק' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('בעל העסק')}>מהצוות</Button>
                    <Button variant={filter === 'לקוח' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('לקוח')}>רק שלי</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <div className="min-w-full">
              {/* Header */}
              <div className="flex p-3 bg-gray-100 font-semibold text-sm">
                <div className="w-2/5">שם</div>
                <div className="w-1/5">הועלה ע"י</div>
                <div className="w-1/5">תאריך</div>
                <div className="w-1/5 text-left">פעולות</div>
              </div>
              {/* Body */}
              <div className="divide-y">
                {filteredDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center p-3">
                    <div className="w-2/5 flex items-center gap-2 font-medium"><FileText className="h-4 w-4 text-gray-500"/>{doc.name}</div>
                    <div className="w-1/5 flex items-center gap-2 text-sm text-gray-600">
                        {doc.uploaded_by === 'לקוח' ? <User className="h-4 w-4"/> : <Building className="h-4 w-4"/>}
                        {doc.uploaded_by}
                    </div>
                    <div className="w-1/5 text-sm text-gray-600">{format(new Date(doc.created_date), 'dd/MM/yy')}</div>
                    <div className="w-1/5 text-left">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                           <Button variant="ghost" size="icon"><Download className="h-4 w-4"/></Button>
                        </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {filteredDocuments.length === 0 && <p className="text-center py-8 text-gray-500">אין מסמכים להצגה בסינון זה.</p>}
        </CardContent>
      </Card>
    </div>
  );
}