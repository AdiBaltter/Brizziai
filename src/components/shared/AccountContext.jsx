
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Account } from '@/api/entities';
import { AccountUser } from '@/api/entities';
import { Process } from '@/api/entities'; // Import the Process entity

const AccountContext = createContext();

// Define default stages for the process
const DEFAULT_STAGES = [
  { id: 'new-lead', name: 'ליד חדש', description: 'קליטת ליד חדש ופתיחת חדר דיגיטלי', category: 'new-lead', defaultConfig: { timing_preset: 'immediately', visibility: 'internal', category: 'new-lead' } },
  { id: 'schedule-meeting', name: 'קביעת פגישה', description: 'שלב בו מתבצעת קביעת פגישה', category: 'schedule-meeting', defaultConfig: { timing_preset: '1_day', visibility: 'external', category: 'schedule-meeting' } },
  { id: 'meeting', name: 'פגישה', description: 'שלב הפגישה עצמה', category: 'meeting', defaultConfig: { timing_preset: 'custom', visibility: 'external', category: 'meeting', meeting_duration: 60 } },
  { id: 'send-message', name: 'שליחת הודעה / תזכורת', description: 'שליחת תקשורת יזומה או מתוזמנת ללקוח', category: 'send-message', defaultConfig: { timing_preset: '1_day', visibility: 'external', category: 'send-message', message_config: { delivery_method: 'email', message_type: 'regular', content: '', timing_type: 'immediate' } } },
  { id: 'documents', name: 'שליחה / בקשת חומרים', description: 'שיתוף או קבלת מסמכים בין העסק ללקוח', category: 'documents', defaultConfig: { timing_preset: '1_day', visibility: 'external', category: 'documents', documents_config: { action_type: 'request', execution_method: 'manual', request_config: { create_followup_task: false } } } },
  { id: 'price-quote', name: 'הכנת הצעת מחיר', description: 'הכנה ושליחה של הצעת מחיר ללקוח', category: 'price-quote', defaultConfig: { timing_preset: '1_day', visibility: 'external', category: 'price-quote', quote_config: { send_type: 'manual' } } },
  { id: 'phone-call', name: 'שיחת טלפון', description: 'יצירת משימה לביצוע שיחת טלפון', category: 'communication', defaultConfig: { timing_preset: '1_day', visibility: 'internal', category: 'phone-call', phone_call_config: { script: '' } } },
  { id: 'deal-closure', name: 'סגירת עסקה', description: 'סיום התהליך וסגירת העסקה עם הלקוח', category: 'deal-closure', defaultConfig: { timing_preset: 'immediately', visibility: 'internal', category: 'deal-closure' } }
];

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

export const AccountProvider = ({ children }) => {
  const [accountId, setAccountId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [superAdminContext, setSuperAdminContext] = useState(null);

  const fetchAccountContext = async () => {
    try {
      // בדיקת קונטקסט Super Admin
      const contextData = sessionStorage.getItem('superAdminContext');
      if (contextData) {
        const context = JSON.parse(contextData);
        setSuperAdminContext(context);
        if (context.viewingAsOrg) { // Note: superAdminContext still uses 'viewingAsOrg' from legacy
          setAccountId(context.viewingAsOrg);
          setLoading(false);
          return;
        }
      }

      // שליפת נתוני המשתמש הנוכחי
      let user = await User.me();

      // Onboarding for new users: Create an account if one doesn't exist.
      if (!user.account_id) {
        console.log("AccountContext: User has no account_id, creating a new account...");
        
        // 1. Create a new Account
        const newAccount = await Account.create({
          name: `העסק של ${user.full_name || 'משתמש חדש'}`,
          active: true,
        });

        // 2. Update the user with the new account_id
        await User.updateMyUserData({ account_id: newAccount.id });
        
        // 3. Create an AccountUser link to define the user's role in the account
        await AccountUser.create({
            account_id: newAccount.id,
            user_id: user.id,
            role_in_account: 'owner', // The first user becomes the owner
            active: true
        });

        // 4. Create a default Process for the new account
        const defaultProcessStages = DEFAULT_STAGES.map(template => ({
          id: `stage-${template.id}-${Date.now()}`,
          name: template.name,
          description: template.description,
          templateId: template.id,
          ...template.defaultConfig
        }));

        await Process.create({
          name: 'תהליך מכירה כללי',
          description: 'תהליך מכירה ברירת מחדל שנוצר אוטומטית',
          stages: defaultProcessStages,
          is_active: true,
          enforce_structure: true,
          account_id: newAccount.id
        });

        // 5. Refetch the user to get the latest data
        user = await User.me();
      }
      
      setCurrentUser(user);
      
      if (user.account_id) {
        setAccountId(user.account_id);
      } else {
        // This path should no longer be reachable
        console.error('User still does not have account_id after onboarding check.');
        throw new Error('Could not assign an account to the user.');
      }
    } catch (error) {
      console.error('Failed to fetch account context:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountContext();
  }, []);

  const value = {
    accountId,
    currentUser,
    loading,
    superAdminContext,
    refreshContext: fetchAccountContext
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};
