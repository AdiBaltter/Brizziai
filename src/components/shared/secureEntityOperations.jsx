
import { User } from '@/api/entities';

/**
 * מחלקה לביצוע פעולות בצורה מאובטחת עם הפרדת חשבונות
 */
export class SecureEntityOperations {
  constructor(entityClass) {
    this.Entity = entityClass;
  }

  /**
   * שליפת מזהה החשבון הנוכחי
   */
  async getAccountId() {
    // בדיקת קונטקסט Super Admin
    const contextData = sessionStorage.getItem('superAdminContext');
    if (contextData) {
      const context = JSON.parse(contextData);
      if (context.viewingAsOrg) {
        return context.viewingAsOrg;
      }
    }

    // שליפת מזהה החשבון מהמשתמש הנוכחי
    const user = await User.me();
    if (!user.account_id) {
      throw new Error('User does not have account_id');
    }
    return user.account_id;
  }

  /**
   * שליפת רשימת רשומות בצורה מאובטחת
   */
  async secureList(sortBy = '-created_date', limit = null) {
    const accountId = await this.getAccountId();
    return await this.Entity.filter({ account_id: accountId }, sortBy, limit);
  }

  /**
   * חיפוש רשומות בצורה מאובטחת
   */
  async secureFilter(filters = {}, sortBy = '-created_date', limit = null) {
    const accountId = await this.getAccountId();
    const secureFilters = {
      ...filters,
      account_id: accountId
    };
    return await this.Entity.filter(secureFilters, sortBy, limit);
  }

  /**
   * שליפת רשומה יחידה בצורה מאובטחת
   */
  async secureGet(recordId) {
    const accountId = await this.getAccountId();
    const records = await this.Entity.filter({ 
      id: recordId, 
      account_id: accountId 
    });
    
    if (records.length === 0) {
      throw new Error('Record not found or unauthorized');
    }
    
    return records[0];
  }

  /**
   * יצירת רשומה בצורה מאובטחת
   */
  async secureCreate(data) {
    const accountId = await this.getAccountId();
    const secureData = {
      ...data,
      account_id: accountId
    };
    return await this.Entity.create(secureData);
  }

  /**
   * עדכון רשומה בצורה מאובטחת
   */
  async secureUpdate(recordId, data) {
    // ודוא שהרשומה שייכת לחשבון לפני העדכון
    await this.secureGet(recordId);
    
    // ודוא שלא מנסים לשנות את account_id
    const secureData = { ...data };
    delete secureData.account_id;
    
    return await this.Entity.update(recordId, secureData);
  }

  /**
   * מחיקת רשומה בצורה מאובטחת
   */
  async secureDelete(recordId) {
    try {
      // First, verify the record belongs to the account.
      // This gives us a clear "not found or unauthorized" error.
      await this.secureGet(recordId);
      
      // If secureGet passes, proceed with deletion.
      return await this.Entity.delete(recordId);

    } catch (error) {
      console.error(`[SecureDelete] Failed for recordId: ${recordId}. Original Error:`, error);
      
      if (error.message === 'Record not found or unauthorized') {
          // This specific error comes from our secureGet check.
          throw new Error(`לא ניתן למחוק את הרשומה. הרשומה לא נמצאה או שאין לך הרשאה למחקה.`);
      }
      
      // Handle other potential errors (e.g., from the actual delete call from the SDK)
      throw new Error(`אירעה שגיאה במחיקת הרשומה. ודא שהיא אינה בשימוש ונסה שוב.`);
    }
  }

  /**
   * יצירה בצובה של רשומות בצורה מאובטחת
   */
  async secureBulkCreate(dataArray) {
    const accountId = await this.getAccountId();
    const secureDataArray = dataArray.map(data => ({
      ...data,
      account_id: accountId
    }));
    return await this.Entity.bulkCreate(secureDataArray);
  }
}
