import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, XCircle,
  ChevronRight, Trash2, MessageSquare, User, Calendar,
  MapPin, Phone, Mail, FileImage, FileVideo, Lock, Bell,
  ClipboardList, Loader2, Filter,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type IncidentStatus = 'NEW' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'RESOLVED' | 'CLOSED';
type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type NoteType = 'INTERNAL' | 'UPDATE';

interface IncidentNote {
  id: string;
  type: NoteType;
  body: string;
  authorName: string;
  authorEmail: string;
  emailedToReporter: boolean;
  createdAt: string;
}

interface StatusHistoryEntry {
  id: string;
  fromStatus: IncidentStatus;
  toStatus: IncidentStatus;
  changedBy: string;
  comment: string | null;
  createdAt: string;
}

interface IncidentReport {
  id: string;
  incidentId: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  unitNumber: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentTitle: string;
  incidentDescription: string;
  policeAttended: boolean;
  policeCaseNumber: string | null;
  bylawViolation: boolean;
  commonPropertyDamage: boolean;
  hasEvidence: boolean;
  evidenceFiles: string[];
  status: IncidentStatus;
  priority: IncidentPriority;
  assignedTo: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  notifyReporter: boolean;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
  notes: IncidentNote[];
  statusHistory: StatusHistoryEntry[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  NEW:          { label: 'New',          color: 'bg-blue-100 text-blue-800 border-blue-200',    icon: <ClipboardList className="h-3 w-3" /> },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-3 w-3" /> },
  ACTION_TAKEN: { label: 'Action Taken', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <ChevronRight className="h-3 w-3" /> },
  RESOLVED:     { label: 'Resolved',     color: 'bg-green-100 text-green-800 border-green-200',  icon: <CheckCircle2 className="h-3 w-3" /> },
  CLOSED:       { label: 'Closed',       color: 'bg-gray-100 text-gray-600 border-gray-200',    icon: <XCircle className="h-3 w-3" /> },
};

const PRIORITY_CONFIG: Record<IncidentPriority, { label: string; color: string; dot: string }> = {
  LOW:    { label: 'Low',    color: 'text-gray-500',  dot: 'bg-gray-400' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-600', dot: 'bg-yellow-400' },
  HIGH:   { label: 'High',   color: 'text-orange-600', dot: 'bg-orange-500' },
  URGENT: { label: 'Urgent', color: 'text-red-600',   dot: 'bg-red-500' },
};

const STATUS_ORDER: IncidentStatus[] = ['NEW', 'UNDER_REVIEW', 'ACTION_TAKEN', 'RESOLVED', 'CLOSED'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IncidentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: IncidentPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ageDays(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
}

function AgingBadge({ report }: { report: IncidentReport }) {
  if (report.status === 'RESOLVED' || report.status === 'CLOSED') return null;
  const days = ageDays(report.updatedAt);
  if (days < 7) return null;
  const color = days >= 14 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <AlertTriangle className="h-3 w-3" />
      {days}d stale
    </span>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function IncidentDetailDialog({
  report,
  open,
  onClose,
  onUpdated,
  adminEmail,
  adminName,
}: {
  report: IncidentReport;
  open: boolean;
  onClose: () => void;
  onUpdated: (updated: IncidentReport) => void;
  adminEmail: string;
  adminName: string;
}) {
  const { toast } = useToast();

  // Status update form
  const [newStatus, setNewStatus]       = useState<IncidentStatus>(report.status);
  const [newPriority, setNewPriority]   = useState<IncidentPriority>(report.priority);
  const [assignedTo, setAssignedTo]     = useState(report.assignedTo ?? '');
  const [resolution, setResolution]     = useState(report.resolution ?? '');
  const [statusComment, setStatusComment] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Note form
  const [noteBody, setNoteBody]           = useState('');
  const [noteType, setNoteType]           = useState<NoteType>('INTERNAL');
  const [emailReporter, setEmailReporter] = useState(false);
  const [savingNote, setSavingNote]       = useState(false);

  // Reset when report changes
  useEffect(() => {
    setNewStatus(report.status);
    setNewPriority(report.priority);
    setAssignedTo(report.assignedTo ?? '');
    setResolution(report.resolution ?? '');
    setStatusComment('');
  }, [report.id]);

  const statusChanged  = newStatus !== report.status;
  const priorityChanged = newPriority !== report.priority;
  const assignedChanged = assignedTo !== (report.assignedTo ?? '');
  const resolutionChanged = resolution !== (report.resolution ?? '');
  const hasStatusChanges = statusChanged || priorityChanged || assignedChanged || resolutionChanged;

  async function handleStatusSave() {
    if (!hasStatusChanges) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/incident-reports/${report.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status:     statusChanged  ? newStatus   : undefined,
          priority:   priorityChanged ? newPriority : undefined,
          assignedTo: assignedChanged  ? (assignedTo || null) : undefined,
          resolution: resolutionChanged ? (resolution || null) : undefined,
          comment:    statusComment || undefined,
          changedBy:  adminEmail,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      onUpdated(updated);
      setStatusComment('');
      toast({ title: 'Saved', description: 'Incident updated successfully.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleAddNote() {
    if (!noteBody.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/incident-reports/${report.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:          noteType,
          body:          noteBody.trim(),
          authorName:    adminName,
          authorEmail:   adminEmail,
          emailReporter: noteType === 'UPDATE' && emailReporter,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const note: IncidentNote = await res.json();
      onUpdated({ ...report, notes: [...report.notes, note] });
      setNoteBody('');
      setEmailReporter(false);
      toast({ title: 'Note added', description: noteType === 'UPDATE' && emailReporter ? 'Reporter notified by email.' : 'Note saved.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add note.', variant: 'destructive' });
    } finally {
      setSavingNote(false);
    }
  }

  const isEvidenceImage = (f: string) => /\.(jpeg|jpg|png|webp)$/i.test(f);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            <span className="font-mono text-sm text-muted-foreground">{report.incidentId}</span>
            <span className="mx-1 text-muted-foreground">/</span>
            <span className="truncate">{report.incidentTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-1">

          {/* Status + priority badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            <PriorityDot priority={report.priority} />
            <AgingBadge report={report} />
            {report.policeAttended     && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Police Attended</span>}
            {report.commonPropertyDamage && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Property Damage</span>}
            {report.bylawViolation     && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Bylaw Violation</span>}
            {report.hasEvidence        && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Evidence Attached</span>}
          </div>

          {/* Reporter info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3.5 w-3.5" />{report.reporterName} — Unit {report.unitNumber}</div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{report.reporterEmail}</div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{report.reporterPhone}</div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {report.incidentDate} at {report.incidentTime}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2"><MapPin className="h-3.5 w-3.5" />{report.incidentLocation}</div>
            {report.policeAttended && report.policeCaseNumber && (
              <div className="col-span-2 text-muted-foreground">
                <span className="font-medium text-foreground">Police Case #:</span> {report.policeCaseNumber}
              </div>
            )}
            {report.notifyReporter && (
              <div className="col-span-2 flex items-center gap-1.5 text-green-700 text-xs">
                <Bell className="h-3.5 w-3.5" />Reporter opted in to email updates
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 whitespace-pre-wrap">
            {report.incidentDescription}
          </div>

          {/* Resolution (if set) */}
          {report.resolution && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
              <span className="font-semibold">Resolution:</span> {report.resolution}
            </div>
          )}

          {/* Evidence files */}
          {report.evidenceFiles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Evidence ({report.evidenceFiles.length} file{report.evidenceFiles.length !== 1 ? 's' : ''})
              </p>
              <div className="flex flex-wrap gap-2">
                {report.evidenceFiles.map((f, i) => (
                  <a
                    key={i}
                    href={`/uploads/incidents/${f}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    {isEvidenceImage(f)
                      ? <FileImage className="h-3.5 w-3.5" />
                      : <FileVideo className="h-3.5 w-3.5" />}
                    {f.split('-').slice(-1)[0]}
                  </a>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* ── Status / assignment panel ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Manage Incident</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={newStatus} onValueChange={v => setNewStatus(v as IncidentStatus)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map(s => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Priority</Label>
                <Select value={newPriority} onValueChange={v => setNewPriority(v as IncidentPriority)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as IncidentPriority[]).map(p => (
                      <SelectItem key={p} value={p}>{PRIORITY_CONFIG[p].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Assigned To</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="e.g. council@spectrum4.ca"
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                />
              </div>

              {(newStatus === 'RESOLVED' || newStatus === 'CLOSED') && (
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Resolution Summary</Label>
                  <Textarea
                    className="text-sm min-h-[60px]"
                    placeholder="Describe what action was taken to resolve this incident…"
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                  />
                </div>
              )}

              {statusChanged && (
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Comment (shown in history)</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="Optional reason for this status change…"
                    value={statusComment}
                    onChange={e => setStatusComment(e.target.value)}
                  />
                </div>
              )}
            </div>

            {hasStatusChanges && (
              <Button
                size="sm"
                className="mt-3"
                onClick={handleStatusSave}
                disabled={savingStatus}
              >
                {savingStatus && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            )}
          </div>

          <Separator />

          {/* ── Notes thread ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Notes &amp; Updates ({report.notes.length})
            </p>

            {report.notes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}

            <div className="space-y-2">
              {report.notes.map(note => (
                <div
                  key={note.id}
                  className={`rounded-md p-3 text-sm border ${
                    note.type === 'INTERNAL'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="flex items-center gap-1.5">
                      {note.type === 'INTERNAL'
                        ? <><Lock className="h-3 w-3 text-amber-600" /><span className="text-xs font-medium text-amber-700">Internal</span></>
                        : <><Bell className="h-3 w-3 text-blue-600" /><span className="text-xs font-medium text-blue-700">Update</span></>
                      }
                      {note.emailedToReporter && (
                        <span className="text-xs text-green-700 flex items-center gap-0.5">
                          <Mail className="h-3 w-3" />emailed
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {note.authorName} · {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-800">{note.body}</p>
                </div>
              ))}
            </div>

            {/* Add note form */}
            <div className="mt-3 space-y-2 border rounded-md p-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNoteType('INTERNAL')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      noteType === 'INTERNAL'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-amber-200'
                    }`}
                  >
                    <Lock className="h-3 w-3" />Internal
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteType('UPDATE')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      noteType === 'UPDATE'
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    <Bell className="h-3 w-3" />Reporter Update
                  </button>
                </div>
              </div>

              <Textarea
                className="text-sm min-h-[70px] bg-white"
                placeholder={noteType === 'INTERNAL' ? 'Internal note visible only to admins…' : 'Update message for the reporter…'}
                value={noteBody}
                onChange={e => setNoteBody(e.target.value)}
              />

              <div className="flex items-center justify-between">
                {noteType === 'UPDATE' ? (
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={emailReporter}
                      onCheckedChange={v => setEmailReporter(!!v)}
                      id="email-reporter"
                    />
                    Email this update to reporter
                  </label>
                ) : (
                  <span />
                )}

                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={savingNote || !noteBody.trim()}
                >
                  {savingNote && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Add Note
                </Button>
              </div>
            </div>
          </div>

          {/* ── Status history timeline ── */}
          {report.statusHistory.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">History</p>
                <div className="relative pl-4 space-y-3">
                  <div className="absolute left-1.5 top-1 bottom-1 w-px bg-gray-200" />
                  {report.statusHistory.map((h, i) => (
                    <div key={h.id ?? i} className="relative flex gap-3 items-start text-sm">
                      <span className="absolute -left-3 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-gray-400 ring-1 ring-gray-300" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground text-xs">{new Date(h.createdAt).toLocaleString()} · {h.changedBy}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <StatusBadge status={h.fromStatus} />
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <StatusBadge status={h.toStatus} />
                          {h.comment && <span className="text-xs text-gray-600 italic">"{h.comment}"</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground pt-1">
            Submitted {new Date(report.createdAt).toLocaleString()} · Last updated {new Date(report.updatedAt).toLocaleString()}
            {report.emailSent ? ' · Email sent' : ''}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialReports?: IncidentReport[];
  onReportsChange?: (reports: IncidentReport[]) => void;
  onDeleteConfirm: (message: string, onConfirm: () => void) => void;
}

export default function IncidentManagement({ initialReports = [], onReportsChange, onDeleteConfirm }: Props) {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  const [reports, setReports]               = useState<IncidentReport[]>(initialReports);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [filterStatus, setFilterStatus]     = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchText, setSearchText]         = useState('');

  // Sync when parent passes updated data (e.g. after initial load)
  useEffect(() => { setReports(initialReports); }, [initialReports]);

  const updateReport = useCallback((updated: IncidentReport) => {
    setReports(prev => {
      const next = prev.map(r => r.id === updated.id ? updated : r);
      onReportsChange?.(next);
      return next;
    });
    setSelectedReport(updated);
  }, [onReportsChange]);

  async function handleDelete(report: IncidentReport) {
    onDeleteConfirm(
      `Delete incident report "${report.incidentTitle}" (${report.incidentId})?`,
      async () => {
        try {
          await fetch(`/api/incident-reports/${report.id}`, { method: 'DELETE' });
          const next = reports.filter(r => r.id !== report.id);
          setReports(next);
          onReportsChange?.(next);
          if (selectedReport?.id === report.id) setSelectedReport(null);
          toast({ title: 'Deleted', description: 'Incident report deleted.' });
        } catch {
          toast({ title: 'Error', description: 'Failed to delete report.', variant: 'destructive' });
        }
      }
    );
  }

  // ── Stats ──
  const stats = {
    NEW:          reports.filter(r => r.status === 'NEW').length,
    UNDER_REVIEW: reports.filter(r => r.status === 'UNDER_REVIEW').length,
    ACTION_TAKEN: reports.filter(r => r.status === 'ACTION_TAKEN').length,
    RESOLVED:     reports.filter(r => r.status === 'RESOLVED').length,
    CLOSED:       reports.filter(r => r.status === 'CLOSED').length,
  };
  const urgentCount   = reports.filter(r => r.priority === 'URGENT' && r.status !== 'RESOLVED' && r.status !== 'CLOSED').length;
  const staleCount    = reports.filter(r => r.status !== 'RESOLVED' && r.status !== 'CLOSED' && ageDays(r.updatedAt) >= 14).length;

  // ── Filtering ──
  const filtered = reports.filter(r => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && r.priority !== filterPriority) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return (
        r.incidentTitle.toLowerCase().includes(q) ||
        r.incidentId.toLowerCase().includes(q) ||
        r.reporterName.toLowerCase().includes(q) ||
        r.unitNumber.toLowerCase().includes(q) ||
        r.incidentDescription.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const adminEmail = adminUser?.email ?? 'admin';
  const adminName  = adminUser?.email ?? 'Admin';

  return (
    <div className="space-y-5">

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.entries(stats) as [IncidentStatus, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(filterStatus === status ? 'ALL' : status)}
              className={`text-left p-3 rounded-lg border transition-all ${
                filterStatus === status
                  ? 'ring-2 ring-offset-1 ring-current ' + cfg.color
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`text-2xl font-bold ${filterStatus === status ? '' : 'text-gray-900'}`}>{count}</div>
              <div className={`text-xs font-medium mt-0.5 ${filterStatus === status ? '' : 'text-gray-500'}`}>{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Alert strip */}
      {(urgentCount > 0 || staleCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {urgentCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {urgentCount} urgent open incident{urgentCount !== 1 ? 's' : ''}
            </div>
          )}
          {staleCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-sm">
              <Clock className="h-4 w-4" />
              {staleCount} stale (no update in 14+ days)
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          className="h-8 w-48 text-sm"
          placeholder="Search title, ID, reporter…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            {(['LOW','MEDIUM','HIGH','URGENT'] as IncidentPriority[]).map(p => (
              <SelectItem key={p} value={p}>{PRIORITY_CONFIG[p].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterStatus !== 'ALL' || filterPriority !== 'ALL' || searchText) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterStatus('ALL'); setFilterPriority('ALL'); setSearchText(''); }}>
            Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {reports.length}</span>
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          {reports.length === 0 ? 'No incident reports submitted yet.' : 'No incidents match the current filters.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(report => (
            <div
              key={report.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => setSelectedReport(report)}
            >
              {/* Priority stripe */}
              <div className={`self-stretch w-1 rounded-full shrink-0 ${PRIORITY_CONFIG[report.priority].dot}`} />

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{report.incidentId}</span>
                  <StatusBadge status={report.status} />
                  <PriorityDot priority={report.priority} />
                  <AgingBadge report={report} />
                  {report.policeAttended && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Police</span>
                  )}
                  {report.commonPropertyDamage && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Damage</span>
                  )}
                </div>
                <h4 className="font-semibold text-sm leading-snug">{report.incidentTitle}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{report.reporterName} · Unit {report.unitNumber}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{report.incidentDate}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{report.incidentLocation}</span>
                  {report.assignedTo && <span className="flex items-center gap-1 text-indigo-600"><User className="h-3 w-3" />→ {report.assignedTo}</span>}
                  {report.notes.length > 0 && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{report.notes.length} note{report.notes.length !== 1 ? 's' : ''}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={e => { e.stopPropagation(); handleDelete(report); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      {selectedReport && (
        <IncidentDetailDialog
          report={selectedReport}
          open={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdated={updateReport}
          adminEmail={adminEmail}
          adminName={adminName}
        />
      )}
    </div>
  );
}
