import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  GitMerge,
  Server,
  Cloud,
  FileCheck,
  Search,
  Eye,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Button, useToast } from '../../components/ui';
import { apiClient } from '../../services/api';

export interface ConflictItem {
  id: string;
  hospitalId: string;
  syncEntryId?: string;
  entityType: string;
  entityId: string;
  localVersion: number;
  cloudVersion: number;
  localPayload: Record<string, any>;
  cloudPayload: Record<string, any>;
  conflictReason: string;
  status:
    | 'REQUIRES_CLINICAL_REVIEW'
    | 'RESOLVED_ACCEPT_LOCAL'
    | 'RESOLVED_ACCEPT_CLOUD'
    | 'RESOLVED_MANUAL_MERGE'
    | 'DISCARDED';
  resolutionType?: string;
  resolutionNotes?: string;
  resolvedPayload?: Record<string, any>;
  resolvedAt?: string;
  createdAt: string;
}

export const ClinicalConflictQueueView: React.FC = () => {
  const { showToast } = useToast();
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [resolutionType, setResolutionType] = useState<'ACCEPT_LOCAL' | 'ACCEPT_CLOUD' | 'MANUAL_MERGE'>('ACCEPT_LOCAL');
  const [justification, setJustification] = useState('');
  const [manualJson, setManualJson] = useState('{}');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'REQUIRES_CLINICAL_REVIEW' | 'ALL'>('REQUIRES_CLINICAL_REVIEW');

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'ALL' ? '/deployment/conflicts?status=' : '/deployment/conflicts?status=REQUIRES_CLINICAL_REVIEW';
      const res = await apiClient.get(url);
      if (res.data?.data) {
        setConflicts(res.data.data);
      }
    } catch (err: any) {
      showToast({
        title: 'Failed to load conflict queue',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, [statusFilter]);

  const handleSelectConflict = (c: ConflictItem) => {
    setSelectedConflict(c);
    setResolutionType('ACCEPT_LOCAL');
    setJustification('');
    setManualJson(JSON.stringify(c.localPayload, null, 2));
  };

  const handleResolve = async () => {
    if (!selectedConflict) return;

    if (justification.trim().length < 15) {
      showToast({
        title: 'Validation Error',
        message: 'Clinical justification note must be at least 15 characters long.',
        type: 'error',
      });
      return;
    }

    let parsedMergedPayload = undefined;
    if (resolutionType === 'MANUAL_MERGE') {
      try {
        parsedMergedPayload = JSON.parse(manualJson);
      } catch {
        showToast({
          title: 'Invalid JSON',
          message: 'Merged payload must be valid JSON.',
          type: 'error',
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(`/deployment/conflicts/${selectedConflict.id}/resolve`, {
        resolutionType,
        supervisorJustification: justification.trim(),
        mergedPayload: parsedMergedPayload,
      });

      if (res.data?.success) {
        showToast({
          title: 'Conflict Resolved',
          message: `Collision on ${selectedConflict.entityType} [${selectedConflict.entityId}] resolved with strategy ${resolutionType}.`,
          type: 'success',
        });
        setSelectedConflict(null);
        fetchConflicts();
      }
    } catch (err: any) {
      showToast({
        title: 'Resolution Failed',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredConflicts = conflicts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.entityType.toLowerCase().includes(q) ||
      c.entityId.toLowerCase().includes(q) ||
      c.conflictReason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Manual Clinical Conflict Reconciliation Queue (P0-05)
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Replaces naive Last-Write-Wins (LWW) clinical overwrites. Resolves edge hospital vs cloud concurrent mutation collisions under supervisory clinical governance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchConflicts} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by entity, ID, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('REQUIRES_CLINICAL_REVIEW')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'REQUIRES_CLINICAL_REVIEW'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Main Conflict List & Resolution Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conflict List (Left Pane) */}
        <div className={`space-y-3 ${selectedConflict ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          {filteredConflicts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Clinical Conflicts Pending</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                All edge and cloud clinical mutations are strictly reconciled. Zero divergent patient records detected.
              </p>
            </div>
          ) : (
            filteredConflicts.map((c) => {
              const isSelected = selectedConflict?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConflict(c)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {c.entityType}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {c.entityId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                        {c.conflictReason}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${
                        c.status === 'REQUIRES_CLINICAL_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.status === 'REQUIRES_CLINICAL_REVIEW' ? 'PENDING' : c.status.replace('RESOLVED_', '')}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Local v{c.localVersion} vs Cloud v{c.cloudVersion}</span>
                    <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Resolution Workbench (Right Pane) */}
        {selectedConflict && (
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-blue-600" />
                  Supervisor Resolution Workbench
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record ID: <span className="font-mono text-slate-600">{selectedConflict.id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedConflict(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-Side Payload Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local Mutation */}
              <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    Local Hospital Mutation (Edge)
                  </span>
                  <span className="bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">v{selectedConflict.localVersion}</span>
                </div>
                <pre className="text-[11px] font-mono bg-white p-2.5 rounded border border-blue-100 overflow-x-auto max-h-48 text-slate-700">
                  {JSON.stringify(selectedConflict.localPayload, null, 2)}
                </pre>
              </div>

              {/* Cloud Mutation */}
              <div className="p-3.5 rounded-lg bg-purple-50/50 border border-purple-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5" />
                    Central Cloud Record
                  </span>
                  <span className="bg-purple-100 px-1.5 py-0.5 rounded text-[10px]">v{selectedConflict.cloudVersion}</span>
                </div>
                <pre className="text-[11px] font-mono bg-white p-2.5 rounded border border-purple-100 overflow-x-auto max-h-48 text-slate-700">
                  {JSON.stringify(selectedConflict.cloudPayload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Resolution Strategy Selector */}
            {selectedConflict.status === 'REQUIRES_CLINICAL_REVIEW' ? (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Reconciled Target:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setResolutionType('ACCEPT_LOCAL')}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        resolutionType === 'ACCEPT_LOCAL'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Server className="w-3.5 h-3.5" />
                        <span>Accept Local</span>
                      </div>
                      <p className="text-[10px] font-normal text-slate-500">
                        Prioritize edge hospital bedside clinical record.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolutionType('ACCEPT_CLOUD')}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        resolutionType === 'ACCEPT_CLOUD'
                          ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Accept Cloud</span>
                      </div>
                      <p className="text-[10px] font-normal text-slate-500">
                        Keep current central cloud database state.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolutionType('MANUAL_MERGE')}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        resolutionType === 'MANUAL_MERGE'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Manual Merge</span>
                      </div>
                      <p className="text-[10px] font-normal text-slate-500">
                        Combine field-by-field with custom JSON.
                      </p>
                    </button>
                  </div>
                </div>

                {resolutionType === 'MANUAL_MERGE' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Merged Record JSON (Field Customization):
                    </label>
                    <textarea
                      rows={6}
                      value={manualJson}
                      onChange={(e) => setManualJson(e.target.value)}
                      className="w-full p-2.5 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}

                {/* Mandatory Clinical Justification */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Supervisor Clinical Justification (Mandatory $\ge$ 15 chars):
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        justification.trim().length >= 15 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {justification.trim().length}/15 chars minimum
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Enter clinical rationale for accepting local/cloud or custom merge (e.g. Verified attending physician verbal notes and PACU vitals history)..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedConflict(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleResolve}
                    disabled={submitting || justification.trim().length < 15}
                    className="gap-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    {submitting ? 'Applying Resolution...' : 'Authorize & Resolve Conflict'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-semibold text-slate-700">Already Resolved:</div>
                <div className="text-slate-600">Strategy: <span className="font-bold">{selectedConflict.resolutionType}</span></div>
                <div className="text-slate-600">Supervisor Justification: <span className="italic">{selectedConflict.resolutionNotes}</span></div>
                {selectedConflict.resolvedAt && (
                  <div className="text-slate-400 text-[11px]">Resolved At: {new Date(selectedConflict.resolvedAt).toLocaleString()}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
