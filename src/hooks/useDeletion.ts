import { useState } from 'react';
import { deletionManager, DeletionOptions, DeletionResult } from '../lib/deletion';
import { useAuthContext } from '../components/auth/AuthProvider';

export interface UseDeletionReturn {
  deleteRecord: (
    tableName: string,
    recordId: string,
    options?: Partial<DeletionOptions>
  ) => Promise<DeletionResult>;
  batchDeleteRecords: (
    tableName: string,
    recordIds: string[],
    options?: Partial<DeletionOptions>
  ) => Promise<DeletionResult>;
  restoreRecord: (
    tableName: string,
    recordId: string
  ) => Promise<DeletionResult>;
  isDeleting: boolean;
  lastResult: DeletionResult | null;
  error: string | null;
}

export const useDeletion = (): UseDeletionReturn => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastResult, setLastResult] = useState<DeletionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const deleteRecord = async (
    tableName: string,
    recordId: string,
    options: Partial<DeletionOptions> = {}
  ): Promise<DeletionResult> => {
    if (!user) {
      const errorResult: DeletionResult = {
        success: false,
        deletedCount: 0,
        errors: ['User not authenticated'],
        affectedTables: []
      };
      setLastResult(errorResult);
      setError('User not authenticated');
      return errorResult;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log(`🗑️ Deleting record: ${tableName}/${recordId}`);
      
      const result = options.type === 'hard'
        ? await deletionManager.hardDelete(tableName, recordId, user.id, options)
        : await deletionManager.softDelete(tableName, recordId, user.id, options);

      setLastResult(result);
      
      if (!result.success) {
        setError(result.errors.join(', '));
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown deletion error';
      const errorResult: DeletionResult = {
        success: false,
        deletedCount: 0,
        errors: [errorMessage],
        affectedTables: []
      };
      
      setLastResult(errorResult);
      setError(errorMessage);
      return errorResult;
    } finally {
      setIsDeleting(false);
    }
  };

  const batchDeleteRecords = async (
    tableName: string,
    recordIds: string[],
    options: Partial<DeletionOptions> = {}
  ): Promise<DeletionResult> => {
    if (!user) {
      const errorResult: DeletionResult = {
        success: false,
        deletedCount: 0,
        errors: ['User not authenticated'],
        affectedTables: []
      };
      setLastResult(errorResult);
      setError('User not authenticated');
      return errorResult;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log(`📦 Batch deleting: ${tableName} - ${recordIds.length} records`);
      
      const result = await deletionManager.batchDelete(tableName, recordIds, user.id, options);
      setLastResult(result);
      
      if (!result.success) {
        setError(result.errors.join(', '));
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown batch deletion error';
      const errorResult: DeletionResult = {
        success: false,
        deletedCount: 0,
        errors: [errorMessage],
        affectedTables: []
      };
      
      setLastResult(errorResult);
      setError(errorMessage);
      return errorResult;
    } finally {
      setIsDeleting(false);
    }
  };

  const restoreRecord = async (
    tableName: string,
    recordId: string
  ): Promise<DeletionResult> => {
    if (!user) {
      const errorResult: DeletionResult = {
        success: false,
        deletedCount: 0,
        errors: ['User not authenticated'],
        affectedTables: []
      };
      setLastResult(errorResult);
      setError('User not authenticated');
      return errorResult;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log(`🔄 Restoring record: ${tableName}/${recordId}`);
      
      const result = await deletionManager.restoreRecord(tableName, recordId, user.id);
      setLastResult(result);
      
      if (!result.success) {
        setError(result.errors.join(', '));
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown restore error';
      const errorResult: DeletionResult = {
        success: false,
        deletedCount: 0,
        errors: [errorMessage],
        affectedTables: []
      };
      
      setLastResult(errorResult);
      setError(errorMessage);
      return errorResult;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteRecord,
    batchDeleteRecords,
    restoreRecord,
    isDeleting,
    lastResult,
    error
  };
};