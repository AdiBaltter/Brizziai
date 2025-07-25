import { ProcessAction } from '@/api/entities';
import { Client } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Process } from '@/api/entities';

export class ProcessAutomationService {

  static async handleNewLeadCreation(lead) {
    try {
        console.log(`Starting automation for new lead: ${lead.id}`);

        const processes = await Process.filter({ name: lead.process_type, is_active: true });
        if (processes.length === 0) {
            console.error(`Automation failed: Process "${lead.process_type}" not found or is inactive.`);
            return;
        }
        const process = processes[0];

        if (process.stages && process.stages.length > 1) {
            const firstActionableStage = process.stages[1]; // The stage after 'new-lead'

            let actionType = 'stage_approval';
            let title = `השלם את שלב: ${firstActionableStage.name}`;

            if (firstActionableStage.category === 'schedule-meeting') {
                actionType = 'stage_approval';
                title = `נדרש לקבוע פגישה עם ${lead.full_name}`;
            } else if (firstActionableStage.category === 'phone-call') {
                actionType = 'phone_call_completion';
                title = `נדרש לבצע שיחת טלפון עם ${lead.full_name}`;
            } else if (firstActionableStage.category === 'documents') {
                actionType = 'documents_request_approval';
                title = `שלח בקשה לחומرים מ${lead.full_name}`;
            }

            const actionData = {
                lead_id: lead.id,
                process_stage_id: firstActionableStage.id,
                action_type: actionType,
                title: title,
                status: 'ממתין לאישור',
                stage_name: firstActionableStage.name,
                stage_category: firstActionableStage.category,
                account_id: lead.account_id
            };
            
            await ProcessAction.create(actionData);
            console.log(`Created new process action for lead ${lead.id} at stage "${firstActionableStage.name}"`);

        } else {
             console.warn(`Process "${process.name}" has less than two stages. No initial action created.`);
        }
    } catch (error) {
        console.error('Error in handleNewLeadCreation automation:', error);
    }
  }

  static async approveActionAndAdvanceStage(action, entity) {
    try {
      console.log('Starting approval process for action:', action.id, 'entity:', entity.id);
      
      await ProcessAction.update(action.id, {
        status: 'אושר',
        user_response: 'אושר',
        update_text: 'המשימה אושרה על ידי המשתמש'
      });
      
      // Advance to next stage
      const result = await this.advanceClientToNextStage(
        entity.first_name ? entity.id : null,
        entity.full_name ? entity.id : null,
        entity.account_id,
        entity
      );
      
      return result;
    } catch (error) {
      console.error('Error in approveActionAndAdvanceStage:', error);
      throw error;
    }
  }

  static async advanceClientToNextStage(clientId, leadId, organizationId, entity, process = null) {
    try {
      console.log('Advancing client/lead to next stage:', { clientId, leadId, organizationId });
      
      if (!process) {
        const processes = await Process.filter({ name: entity.process_type, is_active: true });
        if (processes.length === 0) {
            throw new Error(`Process "${entity.process_type}" not found or is inactive.`);
        }
        process = processes[0];
      }
      
      const currentStageIndex = entity.current_stage ? entity.current_stage - 1 : 0;
      const nextStageIndex = currentStageIndex + 1;

      if (nextStageIndex < process.stages.length) {
          const nextStageData = process.stages[nextStageIndex];
          const EntityClass = entity.first_name ? Client : Lead;
          
          await EntityClass.update(entity.id, {
              current_stage: nextStageIndex + 1,
              last_stage_change: new Date().toISOString()
          });
          
          console.log(`Successfully advanced entity ${entity.id} to stage ${nextStageIndex + 1}: "${nextStageData.name}"`);

          // Create next action if not final stage
          if (nextStageData.category !== 'deal-closure') {
               let actionType = 'stage_approval';
               let title = `השלם את שלב: ${nextStageData.name}`;

               if (nextStageData.category === 'schedule-meeting') {
                   actionType = 'stage_approval';
                   title = `נדרש לקבוע פגישה עם ${entity.full_name || (entity.first_name + ' ' + entity.last_name)}`;
               } else if (nextStageData.category === 'phone-call') {
                   actionType = 'phone_call_completion';
                   title = `נדרש לבצע שיחת טלפון עם ${entity.full_name || (entity.first_name + ' ' + entity.last_name)}`;
               } else if (nextStageData.category === 'documents') {
                  actionType = 'documents_request_approval';
                  title = `שלח בקשה לחומרים מ${entity.full_name || (entity.first_name + ' ' + entity.last_name)}`;
               }

              const actionData = {
                  [entity.first_name ? 'client_id' : 'lead_id']: entity.id,
                  process_stage_id: nextStageData.id,
                  action_type: actionType,
                  title: title,
                  status: 'ממתין לאישור',
                  stage_name: nextStageData.name,
                  stage_category: nextStageData.category,
                  account_id: organizationId
              };
          
              await ProcessAction.create(actionData);
              console.log(`Created new process action for entity ${entity.id} at stage "${nextStageData.name}"`);
          } else {
            console.log(`Entity ${entity.id} reached final 'deal-closure' stage.`);
          }
      } else {
           console.log(`Entity ${entity.id} has completed the final stage of the process.`);
      }
    
      return { success: true, nextStage: nextStageIndex + 1 };
    } catch (error) {
      console.error('Error in advanceClientToNextStage:', error);
      throw error;
    }
  }

  static async markLeadAsIrrelevant(clientId, leadId, organizationId) {
    try {
      const entityId = clientId || leadId;
      const EntityClass = clientId ? Client : Lead;
      
      await EntityClass.update(entityId, {
        status: 'לא רלוונטי',
        is_active: false
      });
      
      console.log(`Marked entity ${entityId} as irrelevant`);
      return { success: true };
    } catch (error) {
      console.error('Error marking lead as irrelevant:', error);
      throw error;
    }
  }

  static async createDigitalRoom(clientId) {
    try {
      // Generate room credentials
      const roomId = Math.random().toString(36).substring(2, 15);
      const roomPassword = Math.random().toString(36).substring(2, 10);
      
      await Client.update(clientId, {
        room_id: roomId,
        room_password: roomPassword,
        room_share_token: `${roomId}-${roomPassword}`
      });
      
      console.log(`Created digital room for client ${clientId}`);
      return { success: true, roomId, roomPassword };
    } catch (error) {
      console.error('Error creating digital room:', error);
      throw error;
    }
  }

  static async createDocumentReceiptVerificationTask(clientId, leadId, stageConfig, organizationId) {
    try {
      const entityId = clientId || leadId;
      const entityType = clientId ? 'client' : 'lead';
      
      const actionData = {
        [entityType === 'client' ? 'client_id' : 'lead_id']: entityId,
        process_stage_id: stageConfig.id,
        action_type: 'documents_verify_receipt',
        title: 'בדוק האם החומרים התקבלו',
        status: 'ממתין לאישור',
        stage_name: stageConfig.name,
        stage_category: stageConfig.category,
        account_id: organizationId
      };
      
      await ProcessAction.create(actionData);
      console.log(`Created document receipt verification task for ${entityType} ${entityId}`);
      return { success: true };
    } catch (error) {
      console.error('Error creating document receipt verification task:', error);
      throw error;
    }
  }

  static async createQuoteAcceptanceTask(clientId, leadId, stageConfig, organizationId) {
    try {
      const entityId = clientId || leadId;
      const entityType = clientId ? 'client' : 'lead';
      
      const actionData = {
        [entityType === 'client' ? 'client_id' : 'lead_id']: entityId,
        process_stage_id: stageConfig.id,
        action_type: 'quote_acceptance_approval',
        title: 'בדוק האם ההצעה התקבלה',
        status: 'ממתין לאישור',
        stage_name: stageConfig.name,
        stage_category: stageConfig.category,
        account_id: organizationId
      };
      
      await ProcessAction.create(actionData);
      console.log(`Created quote acceptance task for ${entityType} ${entityId}`);
      return { success: true };
    } catch (error) {
      console.error('Error creating quote acceptance task:', error);
      throw error;
    }
  }
  
  static async handleActionResponse(action, entity, response, notes = '') {
    try {
      console.log('Handling action response:', response, 'for action:', action.id);
      
      const updateData = {
        status: response === 'דלג' ? 'דלג' : 'ליד לא רלוונטי',
        user_response: response,
        update_text: notes || `המשימה ${response === 'דלג' ? 'דולגה' : 'נדחתה כליד לא רלוונטי'}`
      };
      
      await ProcessAction.update(action.id, updateData);
      
      if (response === 'ליד לא רלוונטי') {
        await this.markLeadAsIrrelevant(
          entity.first_name ? entity.id : null,
          entity.full_name ? entity.id : null,
          entity.account_id
        );
        return { success: true };
      }

      if (response === 'דלג') {
        const result = await this.advanceClientToNextStage(
          entity.first_name ? entity.id : null,
          entity.full_name ? entity.id : null,
          entity.account_id,
          entity
        );
        return result;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in handleActionResponse:', error);
      throw error;
    }
  }
  
  static async getOpenActionsForClient(clientId, leadId = null) {
    try {
      const filters = { status: 'ממתין לאישור' };
      
      if (clientId) {
        filters.client_id = clientId;
      }
      if (leadId) {
        filters.lead_id = leadId;
      }
      
      return await ProcessAction.filter(filters, '-created_date');
    } catch (error) {
      console.error('Error getting open actions:', error);
      return [];
    }
  }
  
  static async getAllActionsForClient(clientId, leadId = null) {
    try {
      const filters = {};
      
      if (clientId) {
        filters.client_id = clientId;
      }
      if (leadId) {
        filters.lead_id = leadId;
      }
      
      return await ProcessAction.filter(filters, '-created_date');
    } catch (error) {
      console.error('Error getting all actions:', error);
      return [];
    }
  }
  
  static async createProcessAction(entityId, entityType, stageId, actionType, title, stageData = {}) {
    try {
      const actionData = {
        [entityType === 'client' ? 'client_id' : 'lead_id']: entityId,
        process_stage_id: stageId,
        action_type: actionType,
        title: title,
        status: 'ממתין לאישור',
        stage_name: stageData.name || '',
        stage_category: stageData.category || ''
      };
      
      return await ProcessAction.create(actionData);
    } catch (error) {
      console.error('Error creating process action:', error);
      throw error;
    }
  }
}