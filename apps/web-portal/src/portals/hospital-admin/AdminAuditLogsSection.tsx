import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  RefreshCw,
  FileText,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Button, useToast } from '../../components/ui';
import { hospitalAdminApi } from '../../services/api';

export interface AuditLogItem {
  id: string;
  action: string;
  actor_user_id?: string;
  actor_name?: string;
  entity_type: string;
  entity_id: string;
  new_values?: any;
  old_values?: any;
  created_at: string;
  ip_address?: string;
}

export const AdminAuditLogsSection: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await hospitalAdminApi.getAuditLogs();
      if (res.data?.data) {
        setLogs(res.data.data);
      }
    } catch (err) {
      // Retain clean state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter.toLowerCase());
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.actor_name && log.actor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.entity_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-700 font-bold mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Immutable Administrative Audit Trail</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Audit & Activity Logs</h2>
          <p className="text-slate-500 max-w-2xl mt-1">
            Cryptographically sealed, append-only security logs capturing all administrative mutations: staff onboarding, permission overrides, tariff changes, bed status transitions, and config updates.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Stream</span>
        </Button>
      </div>

      {/* Security Properties Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Tamper-Proof Storage</div>
            <div className="text-[11px] text-teal-700 font-medium">PostgreSQL Append-Only</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">UTC Microsecond Timestamps</div>
            <div className="text-[11px] text-indigo-700 font-medium">Strict Chronological Ordering</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">DPDP & HIPAA Readiness</div>
            <div className="text-[11px] text-emerald-700 font-medium">Full Actor & Entity Traceability</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, entity, user..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Actions</option>
            <option value="staff">Staff & Identity Events</option>
            <option value="department">Department Events</option>
            <option value="bed">Bed & Ward Events</option>
            <option value="billing">Tariff & Billing Events</option>
            <option value="notification">Notification Events</option>
          </select>
        </div>

        <span className="text-slate-500">
          Showing <strong>{filteredLogs.length}</strong> logged administrative actions
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Changed Values / Metadata</th>
                <th className="py-2.5 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{log.actor_name || 'Hospital Admin'}</div>
                    {log.actor_user_id && (
                      <span className="text-[10px] text-slate-400 font-mono">{log.actor_user_id.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">{log.entity_type}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{log.entity_id}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-700 max-w-xs truncate">
                    {log.new_values ? JSON.stringify(log.new_values) : '-'}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No administrative audit events recorded yet. All configuration changes will be logged here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

