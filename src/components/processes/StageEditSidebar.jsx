import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Trash2, MessageCircle, FileText, ChevronDown, ChevronUp, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MessageTemplate } from '@/api/entities';
import { useAccount } from '@/components/shared/AccountContext';
import { SecureEntityOperations } from '@/components/shared/secureEntityOperations';

const DYNAMIC_FIELDS = [
  { label: 'שם לקוח', value: '{{contact_name}}' },
  { label: 'שם פרטי', value: '{{contact_first_name}}' },
  { label: 'שם משפחה', value: '{{contact_last_name}}' },
  { label: 'שם חברה', value: '{{account_name}}' },
  { label: 'שם משתמש', value: '{{user_name}}' },
  { label: 'תאריך פגישה', value: '{{meeting_date}}' },
  { label: 'שעת פגישה', value: '{{meeting_time}}' },
  { label: 'מיקום פגישה', value: '{{meeting_location}}' },
];

const Section = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 py-4">
      <h4
        className="text-md font-semibold text-gray-800 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </h4>
      {isOpen && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
};

const DynamicFieldsSelector = ({ onSelect }) => (
  <div className="mt-2">
    <Label className="text-xs text-gray-500">הוסף שדה דינאמי (לחץ להוספה)</Label>
    <div className="flex flex-wrap gap-1 mt-1">
      {DYNAMIC_FIELDS.map(field => (
        <Badge
          key={field.value}
          variant="secondary"
          className="cursor-pointer hover:bg-gray-300 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(field.value);
          }}
        >
          {field.label}
        </Badge>
      ))}
    </div>
  </div>
);

export default function StageEditSidebar({ stage, template, onUpdate, onDelete, onClose }) {
  const [localStage, setLocalStage] = useState(stage);
  const activeInputRef = useRef(null);
  const { accountId } = useAccount();

  useEffect(() => {
    setLocalStage(stage);
  }, [stage]);

  const handleUpdate = (field, value) => {
    const updatedStage = { ...localStage, [field]: value };
    setLocalStage(updatedStage);
    onUpdate(stage.id, field, value);
  };

  const handleConfigUpdate = (configName, field, value) => {
    const updatedConfig = { ...localStage[configName], [field]: value };
    handleUpdate(configName, updatedConfig);
  };

  const handleMessageConfigUpdate = (field, value) => {
    handleConfigUpdate('message_config', field, value);
  };

  const handleInsertPlaceholder = (placeholder) => {
    if (!activeInputRef.current) return;
    
    const target = activeInputRef.current;
    const { name, selectionStart, value } = target;
    const newValue = value.substring(0, selectionStart) + placeholder + value.substring(selectionStart);
    
    handleMessageConfigUpdate(name, newValue);

    setTimeout(() => {
      target.focus();
      target.selectionStart = target.selectionEnd = selectionStart + placeholder.length;
    }, 0);
  };

  if (!stage || !template) return null;

  const renderTimingOptions = () => {
    if (template.hideTimingConfig) return null;

    if (template.advancedTiming) {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="timing-type">תזמון שליחה</Label>
            <Select
              value={localStage.timing_type || 'immediate'}
              onValueChange={(value) => handleUpdate('timing_type', value)}
            >
              <SelectTrigger id="timing-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">מיידי</SelectItem>
                <SelectItem value="after_previous">אחרי השלב הקודם</SelectItem>
                <SelectItem value="before_next">לפני השלב הבא</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {['after_previous', 'before_next'].includes(localStage.timing_type) && (
             <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="scheduled-delay-value">ערך</Label>
                <Input
                  id="scheduled-delay-value"
                  type="number"
                  min="1"
                  value={localStage.message_config?.scheduled_delay_value || 1}
                  onChange={(e) => handleMessageConfigUpdate('scheduled_delay_value', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="scheduled-delay-unit">יחידה</Label>
                <Select
                  value={localStage.message_config?.scheduled_delay_unit || 'days'}
                  onValueChange={(value) => handleMessageConfigUpdate('scheduled_delay_unit', value)}
                >
                  <SelectTrigger id="scheduled-delay-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">שעות</SelectItem>
                    <SelectItem value="days">ימים</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </>
      );
    }
    return null;
  };
  
  const renderMessageConfig = () => {
    const config = localStage.message_config || {};
    return (
      <Section title="הגדרות הודעה">
        <div className="space-y-2">
          <Label>פלטפורמת שליחה</Label>
          <div className="flex items-center justify-between p-1 bg-gray-100 rounded-lg">
            <Button
              variant={config.platform === 'whatsapp' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => handleMessageConfigUpdate('platform', 'whatsapp')}
            >
              WhatsApp
            </Button>
            <Button
              variant={config.platform === 'email' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => handleMessageConfigUpdate('platform', 'email')}
            >
              Email
            </Button>
          </div>
        </div>

        {config.platform === 'email' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">כותרת המייל</Label>
              <Input
                id="email-subject"
                name="email_subject"
                value={config.email_subject || ''}
                onChange={(e) => handleMessageConfigUpdate('email_subject', e.target.value)}
                onFocus={(e) => (activeInputRef.current = e.target)}
              />
              <DynamicFieldsSelector onSelect={handleInsertPlaceholder} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-content">תוכן הודעת אימייל</Label>
              <Textarea
                id="email-content"
                name="email_content"
                rows={8}
                value={config.email_content || ''}
                onChange={(e) => handleMessageConfigUpdate('email_content', e.target.value)}
                onFocus={(e) => (activeInputRef.current = e.target)}
              />
              <DynamicFieldsSelector onSelect={handleInsertPlaceholder} />
            </div>
          </div>
        )}

        {config.platform === 'whatsapp' && (
          <div className="space-y-2">
            <Label htmlFor="whatsapp-content">תוכן הודעת וואטסאפ</Label>
            <Textarea
              id="whatsapp-content"
              name="whatsapp_content"
              rows={8}
              value={config.whatsapp_content || ''}
              onChange={(e) => handleMessageConfigUpdate('whatsapp_content', e.target.value)}
              onFocus={(e) => (activeInputRef.current = e.target)}
            />
            <DynamicFieldsSelector onSelect={handleInsertPlaceholder} />
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => alert('ההודעה נשמרה!')}>
                <Save className="h-4 w-4 ml-2" /> שמור הודעה
            </Button>
        </div>
      </Section>
    );
  };
  
  const renderPhoneCallConfig = () => (
    <Section title="הגדרות שיחת טלפון">
        <Label htmlFor="call-script">תסריט שיחה / נקודות מרכזיות</Label>
        <Textarea
            id="call-script"
            rows={8}
            value={localStage.phone_call_config?.script || ''}
            onChange={(e) => handleConfigUpdate('phone_call_config', 'script', e.target.value)}
            onFocus={(e) => (activeInputRef.current = e.target)}
        />
        <DynamicFieldsSelector onSelect={handleInsertPlaceholder} />
    </Section>
  );

  const renderDocumentsConfig = () => {
      const config = localStage.documents_config || {};
      return (
          <Section title="הגדרות מסמכים">
              <div className="space-y-2">
                  <Label>סוג פעולה</Label>
                  {/* לוגיקה לבחירת בקשה/שליחה */}
              </div>
          </Section>
      );
  };

  return (
    <div className="fixed top-0 left-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300" dir="rtl">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold">{template.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <Section title="הגדרות בסיסיות">
          <div className="space-y-2">
            <Label htmlFor="stage-name">שם השלב (תצוגה פנימית)</Label>
            <Input
              id="stage-name"
              value={localStage.name}
              onChange={(e) => handleUpdate('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage-description">תיאור</Label>
            <Textarea
              id="stage-description"
              value={localStage.description}
              onChange={(e) => handleUpdate('description', e.target.value)}
              rows={3}
            />
          </div>
        </Section>
        
        <Section title="תצוגה והתנהגות">
            <div className="flex items-center justify-between">
              <Label htmlFor="visibility-switch">גלוי ללקוח בפורטל</Label>
              <Switch
                id="visibility-switch"
                checked={localStage.visibility === 'external'}
                onCheckedChange={(checked) => handleUpdate('visibility', checked ? 'external' : 'internal')}
              />
            </div>
             {localStage.visibility === 'external' && (
                <div className="space-y-2 pl-2 mt-2">
                    <Label htmlFor="client-display-name">שם לתצוגת לקוח</Label>
                    <Input
                        id="client-display-name"
                        value={localStage.client_display_name || ''}
                        onChange={(e) => handleUpdate('client_display_name', e.target.value)}
                        placeholder={localStage.name}
                    />
                </div>
            )}
        </Section>
        
        {stage.category === 'send-message' && !template.hideTimingConfig && (
          <Section title="הגדרות אוטומציה">
              <div className="flex items-center justify-between">
                  <Label htmlFor="delivery-method">שליחה אוטומטית</Label>
                   <Switch
                      id="delivery-method"
                      checked={localStage.message_config?.delivery_method === 'automatic'}
                      onCheckedChange={(checked) => handleMessageConfigUpdate('delivery_method', checked ? 'automatic' : 'manual')}
                  />
              </div>
              {localStage.message_config?.delivery_method === 'automatic' && (
                  <div className="pt-4 border-t mt-4 space-y-4">
                      {renderTimingOptions()}
                  </div>
              )}
          </Section>
        )}
        
        {stage.category === 'send-message' && renderMessageConfig()}
        {stage.category === 'phone-call' && renderPhoneCallConfig()}
        {stage.category === 'documents' && renderDocumentsConfig()}
        
      </div>

      <div className="p-4 border-t border-gray-200">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 ml-2" />
              מחק שלב
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תמחק את השלב "{localStage.name}" לצמיתות מהתהליך.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(stage.id)} className="bg-red-600 hover:bg-red-700">
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}