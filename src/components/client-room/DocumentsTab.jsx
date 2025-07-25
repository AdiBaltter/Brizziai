
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Document } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { 
    Upload, 
    Download, 
    Trash2, 
    User, 
    Building, 
    Square, 
    ExternalLink,
    File,
    FileImage,
    FileSpreadsheet,
    FileText,
    Edit3,
    Save,
    X,
    Eye,
    EyeOff,
    Filter,
    Plus,
    FolderOpen
} from 'lucide-react';
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const getFileIcon = (fileType) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    if (type.includes('doc')) return <FileText className="h-6 w-6 text-blue-500" />;
    if (type.includes('xls')) return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    if (['jpg', 'jpeg', 'png', 'gif'].some(ext => type.includes(ext))) return <FileImage className="h-6 w-6 text-purple-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
};

const getCategoryIcon = (category) => {
    switch (category) {
        case 'חוזים': return '📋';
        case 'הצעות': return '💼';
        case 'קבצים פנימיים': return '🔒';
        case 'מסמכים כלליים': return '📄';
        case 'אישורים': return '✅';
        case 'תכניות': return '📐';
        case 'תמונות': return '🖼️';
        default: return '📁';
    }
};

const categoryColors = {
    'חוזים': 'bg-blue-100 text-blue-700 border-blue-200',
    'הצעות': 'bg-green-100 text-green-700 border-green-200',
    'קבצים פנימיים': 'bg-red-100 text-red-700 border-red-200',
    'מסמכים כלליים': 'bg-gray-100 text-gray-700 border-gray-200',
    'אישורים': 'bg-purple-100 text-purple-700 border-purple-200',
    'תכניות': 'bg-orange-100 text-orange-700 border-orange-200',
    'תמונות': 'bg-pink-100 text-pink-700 border-pink-200'
};

export default function DocumentsTab({ client, documents, onUpdate }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [editName, setEditName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [uploadCategory, setUploadCategory] = useState('מסמכים כלליים');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const fileType = file.name.split('.').pop().toUpperCase();

      await Document.create({
        name: file.name,
        client_id: client.id,
        file_url: file_url,
        file_type: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'JPG', 'PNG'].includes(fileType) ? fileType : 'אחר',
        uploaded_by: 'בעל העסק',
        visibility: 'חיצוני',
        category: uploadCategory,
        size: file.size,
        requires_signature: false, // Added field
        is_signed: false // Added field
      });

      setFile(null);
      setUploadCategory('מסמכים כלליים');
      document.getElementById('file-input').value = '';
      onUpdate();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm("האם למחוק את המסמך?")) {
        try {
            await Document.delete(docId);
            onUpdate();
        } catch (error) {
            console.error("Error deleting document:", error);
        }
    }
  };

  const handleOwnerChange = async (doc, newOwner) => {
    try {
      await Document.update(doc.id, { uploaded_by: newOwner });
      onUpdate();
    } catch (error) {
      console.error("Error updating document owner:", error);
    }
  };

  const handleVisibilityChange = async (doc, newVisibility) => {
    try {
      await Document.update(doc.id, { visibility: newVisibility });
      onUpdate();
    } catch (error) {
      console.error("Error updating document visibility:", error);
    }
  };

  const handleCategoryChange = async (doc, newCategory) => {
    try {
      await Document.update(doc.id, { category: newCategory });
      onUpdate();
    } catch (error) {
      console.error("Error updating document category:", error);
    }
  };

  const handleNameEdit = (doc) => {
    setEditingDocId(doc.id);
    setEditName(doc.name);
  };

  const handleNameSave = async (docId) => {
    try {
      await Document.update(docId, { name: editName });
      setEditingDocId(null);
      setEditName('');
      onUpdate();
    } catch (error) {
      console.error("Error updating document name:", error);
    }
  };

  const handleNameCancel = () => {
    setEditingDocId(null);
    setEditName('');
  };

  const handleSignatureChange = async (doc, field, value) => {
    try {
      const updateData = { [field]: value };
      if (field === 'is_signed' && value) {
        updateData.signature_date = new Date().toISOString().split('T')[0];
      } else if (field === 'is_signed' && !value) {
          updateData.signature_date = null; // Clear date if unsigned
      }
      // If requires_signature is set to false, also set is_signed to false and clear date
      if (field === 'requires_signature' && !value) {
          updateData.is_signed = false;
          updateData.signature_date = null;
      }

      await Document.update(doc.id, updateData);
      onUpdate();
    } catch (error) {
      console.error("Error updating document signature:", error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (categoryFilter === 'all') return true;
    return doc.category === categoryFilter;
  });

  const getDocumentsByCategory = () => {
    const grouped = {};
    filteredDocuments.forEach(doc => {
      const category = doc.category || 'מסמכים כלליים';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(doc);
    });
    return grouped;
  };

  const documentsByCategory = getDocumentsByCategory();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>העלאת מסמך חדש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input id="file-input" type="file" onChange={handleFileChange} className="flex-1" />
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="חוזים">📋 חוזים</SelectItem>
                <SelectItem value="הצעות">💼 הצעות</SelectItem>
                <SelectItem value="קבצים פנימיים">🔒 קבצים פנימיים</SelectItem>
                <SelectItem value="מסמכים כלליים">📄 מסמכים כלליים</SelectItem>
                <SelectItem value="אישורים">✅ אישורים</SelectItem>
                <SelectItem value="תכניות">📐 תכניות</SelectItem>
                <SelectItem value="תמונות">🖼️ תמונות</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              <Upload className="h-4 w-4 ml-2" />
              {uploading ? "מעלה..." : "העלה קובץ"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>מסמכים</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="סינון לפי קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                <SelectItem value="חוזים">📋 חוזים</SelectItem>
                <SelectItem value="הצעות">💼 הצעות</SelectItem>
                <SelectItem value="קבצים פנימיים">🔒 קבצים פנימיים</SelectItem>
                <SelectItem value="מסמכים כלליים">📄 מסמכים כלליים</SelectItem>
                <SelectItem value="אישורים">✅ אישורים</SelectItem>
                <SelectItem value="תכניות">📐 תכניות</SelectItem>
                <SelectItem value="תמונות">🖼️ תמונות</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
            {Object.keys(documentsByCategory).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(documentsByCategory).map(([category, categoryDocs]) => (
                        <div key={category} className="space-y-3">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <span className="text-lg">{getCategoryIcon(category)}</span>
                                <h3 className="font-semibold text-gray-900">{category}</h3>
                                <span className="text-sm text-gray-500">({categoryDocs.length})</span>
                            </div>
                            
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50/70 p-3 border-b font-medium text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <div className="w-10 flex-shrink-0"></div>
                                        <div className="flex-1 min-w-[200px]">שם</div>
                                        <div className="w-32 flex-shrink-0 px-2">קטגוריה</div>
                                        <div className="w-32 flex-shrink-0 px-2">נראות</div>
                                        <div className="w-32 flex-shrink-0 px-2">חתימה</div> {/* Added column header */}
                                        <div className="w-48 flex-shrink-0 px-2">הועלה על ידי</div>
                                        <div className="w-40 flex-shrink-0 px-2">תאריך הוספה</div>
                                        <div className="w-32 flex-shrink-0 text-center px-2">פעולות</div>
                                    </div>
                                </div>
                                
                                <div className="divide-y">
                                    {categoryDocs.map(doc => (
                                        <div key={doc.id} className="flex items-center p-3 hover:bg-gray-50">
                                            <div className="w-10 flex-shrink-0">{getFileIcon(doc.file_type)}</div>
                                            <div className="flex-1 min-w-[200px] flex items-center gap-3 pr-1">
                                                {editingDocId === doc.id ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Input
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="h-8"
                                                        />
                                                        <Button size="icon" className="h-8 w-8" onClick={() => handleNameSave(doc.id)}>
                                                            <Save className="h-3 w-3" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleNameCancel}>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline flex items-center gap-1.5 truncate">
                                                            <span className="truncate">{doc.name}</span>
                                                            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                                        </a>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleNameEdit(doc)}>
                                                            <Edit3 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-32 flex-shrink-0 px-2">
                                                <Select value={doc.category || 'מסמכים כלליים'} onValueChange={(value) => handleCategoryChange(doc, value)}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="חוזים">📋 חוזים</SelectItem>
                                                        <SelectItem value="הצעות">💼 הצעות</SelectItem>
                                                        <SelectItem value="קבצים פנימיים">🔒 קבצים פנימיים</SelectItem>
                                                        <SelectItem value="מסמכים כלליים">📄 מסמכים כלליים</SelectItem>
                                                        <SelectItem value="אישורים">✅ אישורים</SelectItem>
                                                        <SelectItem value="תכניות">📐 תכניות</SelectItem>
                                                        <SelectItem value="תמונות">🖼️ תמונות</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-32 flex-shrink-0 px-2">
                                                <Select value={doc.visibility || 'חיצוני'} onValueChange={(value) => handleVisibilityChange(doc, value)}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="חיצוני">
                                                            <div className="flex items-center gap-2">
                                                                <Eye className="h-4 w-4 text-green-500" /> חיצוני
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="פנימי">
                                                             <div className="flex items-center gap-2">
                                                                <EyeOff className="h-4 w-4 text-red-500" /> פנימי
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-32 flex-shrink-0 px-2"> {/* New column content */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={doc.requires_signature || false}
                                                            onChange={(e) => handleSignatureChange(doc, 'requires_signature', e.target.checked)}
                                                            className="h-3 w-3"
                                                        />
                                                        <span className="text-xs">דרוש חתימה</span>
                                                    </div>
                                                    {doc.requires_signature && (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={doc.is_signed || false}
                                                                onChange={(e) => handleSignatureChange(doc, 'is_signed', e.target.checked)}
                                                                className="h-3 w-3"
                                                            />
                                                            <span className="text-xs">נחתם</span>
                                                            {doc.is_signed && doc.signature_date && (
                                                                <span className="text-xs text-green-600">
                                                                    ✓ {format(new Date(doc.signature_date), 'd/M/yy')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-48 flex-shrink-0 px-2">
                                                <Select value={doc.uploaded_by} onValueChange={(value) => handleOwnerChange(doc, value)}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="בעל העסק">
                                                            <div className="flex items-center gap-2">
                                                                <Building className="h-4 w-4 text-gray-500" /> בעל העסק
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="לקוח">
                                                             <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-gray-500" /> לקוח
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-40 flex-shrink-0 px-2 text-sm text-gray-600">
                                                {format(new Date(doc.created_date), 'd MMM yyyy', {locale: he})}
                                            </div>
                                            <div className="w-32 flex-shrink-0 flex justify-center gap-1 px-2">
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                                                </a>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 h-8 w-8" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-8">אין מסמכים להצגה.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
