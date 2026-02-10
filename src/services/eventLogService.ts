import { supabase } from '../lib/supabase';

export type EventType = 'error' | 'warning' | 'info' | 'auth' | 'data_change' | 'system';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface LogEventParams {
  eventType: EventType;
  severity: Severity;
  source: string;
  message: string;
  details?: Record<string, unknown>;
}

export async function logEvent({ eventType, severity, source, message, details }: LogEventParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('event_logs').insert({
      event_type: eventType,
      severity,
      source,
      message,
      details: details ?? {},
      user_id: user?.id ?? null,
      user_email: user?.email ?? '',
    });
  } catch {
    if (import.meta.env.DEV) {
      console.warn('[eventLogService] Failed to persist event log');
    }
  }
}

export async function logError(source: string, message: string, error?: unknown): Promise<void> {
  const details: Record<string, unknown> = {};
  if (error instanceof Error) {
    details.errorMessage = error.message;
    details.stack = error.stack;
  } else if (error) {
    details.raw = String(error);
  }

  await logEvent({ eventType: 'error', severity: 'high', source, message, details });
}

export async function logWarning(source: string, message: string, details?: Record<string, unknown>): Promise<void> {
  await logEvent({ eventType: 'warning', severity: 'medium', source, message, details });
}

export async function logInfo(source: string, message: string, details?: Record<string, unknown>): Promise<void> {
  await logEvent({ eventType: 'info', severity: 'info', source, message, details });
}

export interface EventLogEntry {
  id: string;
  event_type: EventType;
  severity: Severity;
  source: string;
  message: string;
  details: Record<string, unknown>;
  user_id: string | null;
  user_email: string;
  ip_address: string;
  created_at: string;
}

export interface EventLogFilters {
  eventType?: EventType;
  severity?: Severity;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export async function getEventLogs(
  page: number,
  pageSize: number,
  filters?: EventLogFilters
): Promise<{ data: EventLogEntry[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('event_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters?.eventType) {
    query = query.eq('event_type', filters.eventType);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`);
  }
  if (filters?.search) {
    query = query.or(`message.ilike.%${filters.search}%,source.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return { data: (data as EventLogEntry[]) || [], count: count || 0 };
}

export async function exportEventLogs(filters?: EventLogFilters): Promise<EventLogEntry[]> {
  let query = supabase
    .from('event_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10000);

  if (filters?.eventType) query = query.eq('event_type', filters.eventType);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.startDate) query = query.gte('created_at', filters.startDate);
  if (filters?.endDate) query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`);
  if (filters?.search) {
    query = query.or(`message.ilike.%${filters.search}%,source.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as EventLogEntry[]) || [];
}
