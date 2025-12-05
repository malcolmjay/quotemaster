import { supabase } from './supabase';

export interface DeletionOptions {
  type: 'soft' | 'hard';
  userId?: string;
  reason?: string;
  cascadeDelete?: boolean;
}

export interface DeletionResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
  affectedTables: string[];
}

export interface DeletionLog {
  id: string;
  table_name: string;
  record_id: string;
  deletion_type: 'soft' | 'hard';
  deleted_by: string;
  deletion_reason?: string;
  deleted_at: string;
  restored_at?: string;
  cascade_info?: any;
}

/**
 * Comprehensive record deletion system with safety features
 */
export class RecordDeletionManager {
  private static instance: RecordDeletionManager;
  
  public static getInstance(): RecordDeletionManager {
    if (!RecordDeletionManager.instance) {
      RecordDeletionManager.instance = new RecordDeletionManager();
    }
    return RecordDeletionManager.instance;
  }

  /**
   * Log deletion operation for audit trail
   */
  private async logDeletion(
    tableName: string,
    recordId: string,
    deletionType: 'soft' | 'hard',
    userId: string,
    reason?: string,
    cascadeInfo?: any
  ): Promise<void> {
    try {
      console.log(`📝 Logging deletion: ${tableName}/${recordId} by ${userId}`);
      
      // In a real implementation, you would save to a deletion_log table
      const logEntry: DeletionLog = {
        id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        table_name: tableName,
        record_id: recordId,
        deletion_type: deletionType,
        deleted_by: userId,
        deletion_reason: reason,
        deleted_at: new Date().toISOString(),
        cascade_info: cascadeInfo
      };
      
      console.log('✅ Deletion logged:', logEntry);
      
      // Store in localStorage for demo purposes (use proper audit table in production)
      const existingLogs = JSON.parse(localStorage.getItem('deletion_logs') || '[]');
      existingLogs.push(logEntry);
      localStorage.setItem('deletion_logs', JSON.stringify(existingLogs));
      
    } catch (error) {
      console.error('❌ Failed to log deletion:', error);
    }
  }

  /**
   * Validate record exists and user has permission to delete
   */
  private async validateDeletion(
    tableName: string,
    recordId: string,
    userId: string
  ): Promise<{ valid: boolean; error?: string; record?: any }> {
    try {
      console.log(`🔍 Validating deletion: ${tableName}/${recordId} by ${userId}`);
      
      // Check if record exists
      const { data: record, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', recordId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Record fetch error:', fetchError);
        return { valid: false, error: `Record not found: ${fetchError.message}` };
      }

      if (!record) {
        return { valid: false, error: 'Record does not exist' };
      }

      // Check ownership for user-owned records
      if (record.created_by && record.created_by !== userId) {
        return { valid: false, error: 'Insufficient permissions to delete this record' };
      }

      console.log('✅ Validation passed for record:', record);
      return { valid: true, record };
      
    } catch (error) {
      console.error('❌ Validation error:', error);
      return { valid: false, error: error instanceof Error ? error.message : 'Validation failed' };
    }
  }

  /**
   * Soft delete: Mark record as deleted without removing from database
   */
  async softDelete(
    tableName: string,
    recordId: string,
    userId: string,
    options: Partial<DeletionOptions> = {}
  ): Promise<DeletionResult> {
    console.log(`🗑️ Starting soft delete: ${tableName}/${recordId}`);
    
    try {
      // Validate deletion
      const validation = await this.validateDeletion(tableName, recordId, userId);
      if (!validation.valid) {
        return {
          success: false,
          deletedCount: 0,
          errors: [validation.error || 'Validation failed'],
          affectedTables: []
        };
      }

      // For tables that support soft delete, update deleted_at field
      // For tables that don't, we'll update status to 'deleted'
      const softDeleteFields: any = {
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      };

      // Try deleted_at field first (preferred)
      let { data, error } = await supabase
        .from(tableName)
        .update(softDeleteFields)
        .eq('id', recordId)
        .select();

      // If deleted_at field doesn't exist, try status field
      if (error && error.message.includes('column "deleted_at" does not exist')) {
        console.log('📝 Using status field for soft delete');
        const { data: statusData, error: statusError } = await supabase
          .from(tableName)
          .update({ status: 'deleted' })
          .eq('id', recordId)
          .select();
        
        data = statusData;
        error = statusError;
      }

      if (error) {
        console.error('❌ Soft delete failed:', error);
        return {
          success: false,
          deletedCount: 0,
          errors: [error.message],
          affectedTables: []
        };
      }

      // Log the deletion
      await this.logDeletion(tableName, recordId, 'soft', userId, options.reason);

      console.log('✅ Soft delete completed successfully');
      return {
        success: true,
        deletedCount: 1,
        errors: [],
        affectedTables: [tableName]
      };

    } catch (error) {
      console.error('❌ Soft delete error:', error);
      return {
        success: false,
        deletedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        affectedTables: []
      };
    }
  }

  /**
   * Hard delete: Permanently remove record from database
   */
  async hardDelete(
    tableName: string,
    recordId: string,
    userId: string,
    options: Partial<DeletionOptions> = {}
  ): Promise<DeletionResult> {
    console.log(`💥 Starting hard delete: ${tableName}/${recordId}`);
    
    try {
      // Validate deletion
      const validation = await this.validateDeletion(tableName, recordId, userId);
      if (!validation.valid) {
        return {
          success: false,
          deletedCount: 0,
          errors: [validation.error || 'Validation failed'],
          affectedTables: []
        };
      }

      // Store record data for logging before deletion
      const recordData = validation.record;

      // Perform hard delete
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('❌ Hard delete failed:', error);
        return {
          success: false,
          deletedCount: 0,
          errors: [error.message],
          affectedTables: []
        };
      }

      // Log the deletion
      await this.logDeletion(tableName, recordId, 'hard', userId, options.reason, recordData);

      console.log('✅ Hard delete completed successfully');
      return {
        success: true,
        deletedCount: 1,
        errors: [],
        affectedTables: [tableName]
      };

    } catch (error) {
      console.error('❌ Hard delete error:', error);
      return {
        success: false,
        deletedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        affectedTables: []
      };
    }
  }

  /**
   * Batch deletion for multiple records
   */
  async batchDelete(
    tableName: string,
    recordIds: string[],
    userId: string,
    options: Partial<DeletionOptions> = {}
  ): Promise<DeletionResult> {
    console.log(`📦 Starting batch delete: ${tableName} - ${recordIds.length} records`);
    
    const results: DeletionResult = {
      success: true,
      deletedCount: 0,
      errors: [],
      affectedTables: [tableName]
    };

    // Validate all records first
    for (const recordId of recordIds) {
      const validation = await this.validateDeletion(tableName, recordId, userId);
      if (!validation.valid) {
        results.errors.push(`${recordId}: ${validation.error}`);
        results.success = false;
      }
    }

    // If any validation failed, return early
    if (!results.success) {
      return results;
    }

    // Perform deletions
    for (const recordId of recordIds) {
      try {
        const deleteResult = options.type === 'hard' 
          ? await this.hardDelete(tableName, recordId, userId, options)
          : await this.softDelete(tableName, recordId, userId, options);

        if (deleteResult.success) {
          results.deletedCount++;
        } else {
          results.errors.push(...deleteResult.errors);
          results.success = false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${recordId}: ${errorMessage}`);
        results.success = false;
      }
    }

    console.log(`✅ Batch delete completed: ${results.deletedCount}/${recordIds.length} successful`);
    return results;
  }

  /**
   * Restore soft-deleted record
   */
  async restoreRecord(
    tableName: string,
    recordId: string,
    userId: string
  ): Promise<DeletionResult> {
    console.log(`🔄 Restoring record: ${tableName}/${recordId}`);
    
    try {
      // Try to restore using deleted_at field
      let { data, error } = await supabase
        .from(tableName)
        .update({ 
          deleted_at: null,
          restored_at: new Date().toISOString(),
          restored_by: userId
        })
        .eq('id', recordId)
        .select();

      // If deleted_at field doesn't exist, try status field
      if (error && error.message.includes('column "deleted_at" does not exist')) {
        console.log('📝 Using status field for restore');
        const { data: statusData, error: statusError } = await supabase
          .from(tableName)
          .update({ status: 'active' })
          .eq('id', recordId)
          .select();
        
        data = statusData;
        error = statusError;
      }

      if (error) {
        console.error('❌ Restore failed:', error);
        return {
          success: false,
          deletedCount: 0,
          errors: [error.message],
          affectedTables: []
        };
      }

      console.log('✅ Record restored successfully');
      return {
        success: true,
        deletedCount: 1,
        errors: [],
        affectedTables: [tableName]
      };

    } catch (error) {
      console.error('❌ Restore error:', error);
      return {
        success: false,
        deletedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        affectedTables: []
      };
    }
  }

  /**
   * Get deletion logs for audit purposes
   */
  getDeletionLogs(): DeletionLog[] {
    try {
      const logs = JSON.parse(localStorage.getItem('deletion_logs') || '[]');
      return logs.sort((a: DeletionLog, b: DeletionLog) => 
        new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
      );
    } catch (error) {
      console.error('❌ Failed to get deletion logs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const deletionManager = RecordDeletionManager.getInstance();