import { ScheduledAction } from '@/api/entities';

export class SchedulingService {
  /**
   * חישוב זמן מתוזמן על בסיס הגדרות השלב
   */
  static calculateScheduledTime(preset, customValue = 1, customUnit = 'days') {
    const now = new Date();
    
    switch (preset) {
      case 'immediately':
        return now;
      case '12_hours':
        return new Date(now.getTime() + (12 * 60 * 60 * 1000));
      case '1_day':
        return new Date(now.getTime() + (24 * 60 * 60 * 1000));
      case '3_days':
        return new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      case 'custom':
        const multiplier = customUnit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        return new Date(now.getTime() + (customValue * multiplier));
      default:
        return new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Default to 1 day
    }
  }

  /**
   * יצירת פעולה מתוזמנת כללית
   */
  static async create(actionType, payload, scheduledTime, accountId, clientId = null, leadId = null, stageId = null) {
    try {
      return await ScheduledAction.create({
        account_id: accountId, // שינוי מ-organization_id ל-account_id
        client_id: clientId,
        lead_id: leadId,
        action_type: actionType,
        scheduled_time: scheduledTime.toISOString(),
        payload: payload,
        process_stage_id: stageId,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error creating scheduled action:', error);
      throw error;
    }
  }

  /**
   * תזמון התקדמות לקוח לשלב הבא
   */
  static async scheduleStageAdvancement(clientId, leadId, newStage, newStatus, scheduledTime, accountId, stageId) {
    const payload = {
      client_id: clientId,
      lead_id: leadId,
      new_stage: newStage,
      new_status: newStatus
    };

    return this.create('advance_stage', payload, scheduledTime, accountId, clientId, leadId, stageId);
  }

  /**
   * תזמון משימה
   */
  static async scheduleTask(taskData, scheduledTime, accountId, clientId = null, leadId = null, stageId = null) {
    return this.create('create_task', taskData, scheduledTime, accountId, clientId, leadId, stageId);
  }

  /**
   * תזמון פגישה
   */
  static async scheduleMeeting(meetingData, scheduledTime, accountId, clientId = null, leadId = null, stageId = null) {
    return this.create('create_meeting', meetingData, scheduledTime, accountId, clientId, leadId, stageId);
  }

  /**
   * תזמון הודעה
   */
  static async scheduleMessage(messageType, messageData, scheduledTime, accountId, clientId = null, leadId = null, stageId = null) {
    const actionType = messageType === 'whatsapp' ? 'send_whatsapp' : 
                      messageType === 'email' ? 'send_email' : 'send_sms';
    
    return this.create(actionType, messageData, scheduledTime, accountId, clientId, leadId, stageId);
  }

  /**
   * תזמון תזכורת
   */
  static async scheduleReminder(reminderData, scheduledTime, accountId, clientId = null, leadId = null, stageId = null) {
    return this.create('send_reminder', reminderData, scheduledTime, accountId, clientId, leadId, stageId);
  }

  /**
   * ביטול פעולות מתוזמנות
   */
  static async cancelScheduledActions(clientId = null, leadId = null, stageId = null) {
    try {
      const filters = {};
      if (clientId) filters.client_id = clientId;
      if (leadId) filters.lead_id = leadId;
      if (stageId) filters.process_stage_id = stageId;
      
      // מציאת כל הפעולות הרלוונטיות עם סטטוס pending
      const pendingActions = await ScheduledAction.filter({
        ...filters,
        status: 'pending'
      });

      // ביטול כל הפעולות
      for (const action of pendingActions) {
        await ScheduledAction.update(action.id, {
          status: 'cancelled'
        });
      }

      return pendingActions.length;
    } catch (error) {
      console.error('Error cancelling scheduled actions:', error);
      throw error;
    }
  }

  /**
   * קבלת פעולות מתוזמנות פעילות
   */
  static async getScheduledActions(accountId, clientId = null, leadId = null) {
    try {
      const filters = {
        account_id: accountId, // שינוי מ-organization_id ל-account_id
        status: 'pending'
      };
      
      if (clientId) filters.client_id = clientId;
      if (leadId) filters.lead_id = leadId;

      return await ScheduledAction.filter(filters, 'scheduled_time');
    } catch (error) {
      console.error('Error getting scheduled actions:', error);
      throw error;
    }
  }
}