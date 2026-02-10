import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollText,
  Search,
  Download,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  Database,
  Monitor,
  Clock
} from 'lucide-react';
import {
  getEventLogs,
  exportEventLogs,
  type EventLogEntry,
  type EventLogFilters,
  type EventType,
  type Severity
} from '../../services/eventLogService';
import { Pagination } from '../common/Pagination';
import { useToast } from '../../context/ToastContext';

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: React.ReactNode; color: string }> = {
  error: { label: 'Error', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-50 text-red-700 border border-red-200' },
  warning: { label: 'Warning', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  info: { label: 'Info', icon: <Info className="h-4 w-4" />, color: 'bg-sky-50 text-sky-700 border border-sky-200' },
  auth: { label: 'Auth', icon: <ShieldAlert className="h-4 w-4" />, color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  data_change: { label: 'Data Change', icon: <Database className="h-4 w-4" />, color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  system: { label: 'System', icon: <Monitor className="h-4 w-4" />, color: 'bg-gray-50 text-gray-700 border border-gray-200' },
};

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 border border-red-300' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 border border-orange-300' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-800 border border-amber-300' },
  low: { label: 'Low', color: 'bg-blue-100 text-blue-800 border border-blue-300' },
  info: { label: 'Info', color: 'bg-gray-100 text-gray-700 border border-gray-300' },
};

const PAGE_SIZE = 50;

export const EventLog: React.FC = () => {
  const [logs, setLogs] = useState<EventLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  const [filters, setFilters] = useState<EventLogFilters>({});
  const [searchInput, setSearchInput] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const activeFilters: EventLogFilters = { ...filters };
      if (searchInput.trim()) activeFilters.search = searchInput.trim();

      const { data, count } = await getEventLogs(currentPage, PAGE_SIZE, activeFilters);
      setLogs(data);
      setTotalItems(count);
    } catch (err) {
      showToast('error', 'Failed to load event logs', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, searchInput, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchInput]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const activeFilters: EventLogFilters = { ...filters };
      if (searchInput.trim()) activeFilters.search = searchInput.trim();

      const data = await exportEventLogs(activeFilters);

      const headers = ['Timestamp', 'Type', 'Severity', 'Source', 'Message', 'User', 'Details'];
      const rows = data.map(log => [
        new Date(log.created_at).toISOString(),
        log.event_type,
        log.severity,
        log.source,
        `"${(log.message || '').replace(/"/g, '""')}"`,
        log.user_email || '',
        `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showToast('success', 'Export complete', `${data.length} log entries exported`);
    } catch (err) {
      showToast('error', 'Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput('');
  };

  const hasActiveFilters = filters.eventType || filters.severity || filters.startDate || filters.endDate || searchInput;

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <div className="bg-white border-b border-[#d4d4d4] sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="text-xs text-[#999] mb-1">Administration / Event Log</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#d9edf7] rounded border border-[#bce8f1]">
                <ScrollText className="h-6 w-6 text-[#31708f]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#333]">Event Log</h1>
                <p className="text-xs text-[#666] mt-0.5">{totalItems} total entries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] rounded border border-[#d4d4d4] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-[#428bca] hover:bg-[#3276b1] rounded transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded border border-[#d4d4d4] p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999]" />
              <input
                type="text"
                placeholder="Search by message, source, or user email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#d4d4d4] rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] bg-white text-[#333] placeholder-[#999]"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded transition-colors ${
                showFilters
                  ? 'bg-[#428bca] border-[#428bca] text-white'
                  : 'border-[#d4d4d4] text-[#666] hover:text-[#333] hover:bg-[#f5f5f5]'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-[#666] hover:text-[#333] hover:bg-[#f5f5f5] border border-transparent hover:border-[#d4d4d4] rounded transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[#d4d4d4]">
              <div>
                <label className="block text-xs font-medium text-[#666] mb-1">Event Type</label>
                <select
                  value={filters.eventType || ''}
                  onChange={(e) => setFilters({ ...filters, eventType: (e.target.value || undefined) as EventType | undefined })}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded text-sm text-[#333] focus:ring-2 focus:ring-[#428bca]"
                >
                  <option value="">All Types</option>
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666] mb-1">Severity</label>
                <select
                  value={filters.severity || ''}
                  onChange={(e) => setFilters({ ...filters, severity: (e.target.value || undefined) as Severity | undefined })}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded text-sm text-[#333] focus:ring-2 focus:ring-[#428bca]"
                >
                  <option value="">All Severities</option>
                  {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666] mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded text-sm text-[#333] focus:ring-2 focus:ring-[#428bca]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666] mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-[#d4d4d4] rounded text-sm text-[#333] focus:ring-2 focus:ring-[#428bca]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded border border-[#d4d4d4] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#428bca]"></div>
              <p className="mt-3 text-sm text-[#666]">Loading event logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <ScrollText className="h-12 w-12 text-[#999] mx-auto mb-3" />
              <p className="text-[#666] font-medium">No log entries found</p>
              <p className="text-sm text-[#999] mt-1">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Event logs will appear here as the system records activity'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f5f5f5] border-b border-[#d4d4d4]">
                  <tr>
                    <th className="w-8 px-3 py-3"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  {logs.map((log) => {
                    const typeConfig = EVENT_TYPE_CONFIG[log.event_type] || EVENT_TYPE_CONFIG.info;
                    const sevConfig = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
                    const isExpanded = expandedRow === log.id;
                    const hasDetails = log.details && Object.keys(log.details).length > 0;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className={`hover:bg-[#fafafa] transition-colors ${hasDetails ? 'cursor-pointer' : ''} ${
                            log.severity === 'critical' ? 'bg-red-50/30' : ''
                          }`}
                          onClick={() => hasDetails && setExpandedRow(isExpanded ? null : log.id)}
                        >
                          <td className="px-3 py-3 text-center">
                            {hasDetails && (
                              isExpanded
                                ? <ChevronDown className="h-4 w-4 text-[#999]" />
                                : <ChevronRight className="h-4 w-4 text-[#999]" />
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm text-[#333]">
                              <Clock className="h-3.5 w-3.5 text-[#999]" />
                              {formatTimestamp(log.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                              {typeConfig.icon}
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${sevConfig.color}`}>
                              {sevConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#333] font-mono">
                            {log.source}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#333] max-w-md truncate">
                            {log.message}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#666]">
                            {log.user_email || '-'}
                          </td>
                        </tr>
                        {isExpanded && hasDetails && (
                          <tr>
                            <td colSpan={7} className="bg-[#fafafa] px-6 py-4 border-t border-[#eee]">
                              <div className="text-xs font-medium text-[#666] mb-2 uppercase">Details</div>
                              <pre className="text-xs font-mono text-[#333] bg-white p-3 rounded border border-[#d4d4d4] overflow-x-auto max-h-64">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && logs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
};
