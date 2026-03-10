import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import {
  ShieldAlert, Loader2, Search, CheckCircle2, Clock,
  ClipboardList, ChevronRight, XCircle, AlertTriangle,
  Bell, Calendar, MapPin, MessageSquare,
} from 'lucide-react';

// ─── Status config (mirrored from IncidentManagement) ────────────────────────

type IncidentStatus = 'NEW' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'RESOLVED' | 'CLOSED';

const STATUS_CONFIG: Record<IncidentStatus, { label: string; description: string; color: string; icon: React.ReactNode }> = {
  NEW: {
    label: 'Received',
    description: 'Your report has been received and is awaiting review.',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <ClipboardList className="h-5 w-5" />,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    description: 'Your report is being reviewed by the strata council or property manager.',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-5 w-5" />,
  },
  ACTION_TAKEN: {
    label: 'Action Taken',
    description: 'Action has been taken in response to your report.',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <ChevronRight className="h-5 w-5" />,
  },
  RESOLVED: {
    label: 'Resolved',
    description: 'This incident has been resolved.',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  CLOSED: {
    label: 'Closed',
    description: 'This report has been closed.',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <XCircle className="h-5 w-5" />,
  },
};

const STATUS_STEPS: IncidentStatus[] = ['NEW', 'UNDER_REVIEW', 'ACTION_TAKEN', 'RESOLVED'];

interface PublicUpdate {
  id: string;
  body: string;
  createdAt: string;
}

interface StatusHistoryEntry {
  fromStatus: IncidentStatus;
  toStatus: IncidentStatus;
  createdAt: string;
}

interface IncidentStatusData {
  incidentId: string;
  incidentTitle: string;
  incidentDate: string;
  incidentLocation: string;
  status: IncidentStatus;
  priority: string;
  assignedTo: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  updates: PublicUpdate[];
  statusHistory: StatusHistoryEntry[];
}

function StatusStepper({ status }: { status: IncidentStatus }) {
  const currentIdx = status === 'CLOSED'
    ? STATUS_STEPS.indexOf('RESOLVED')
    : STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const cfg = STATUS_CONFIG[step];
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                    ? 'bg-white border-current ' + cfg.color + ' scale-110'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <span className="text-xs font-bold">{idx + 1}</span>
                }
              </div>
              <span className={`text-xs mt-1 font-medium hidden sm:block ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                {cfg.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 sm:mb-5 transition-all ${idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function IncidentStatus() {
  const [searchParams] = useSearchParams();

  const [incidentId, setIncidentId] = useState(searchParams.get('ref') ?? '');
  const [email, setEmail]           = useState(searchParams.get('email') ?? '');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [data, setData]             = useState<IncidentStatusData | null>(null);

  // Auto-lookup if both params present in URL
  React.useEffect(() => {
    if (searchParams.get('ref') && searchParams.get('email')) {
      handleLookup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLookup() {
    const ref   = incidentId.trim().toUpperCase();
    const mail  = email.trim().toLowerCase();
    if (!ref || !mail) { setError('Please enter both a reference number and your email address.'); return; }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`/api/incident-status/${encodeURIComponent(ref)}?email=${encodeURIComponent(mail)}`);
      if (res.status === 404) {
        setError('No incident found with that reference number and email address. Please check and try again.');
        return;
      }
      if (!res.ok) throw new Error('Server error');
      const json = await res.json();
      setData(json);
    } catch {
      setError('Something went wrong. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  const statusCfg = data ? STATUS_CONFIG[data.status] : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader
        title="Incident Status"
        description="Check the status of your submitted incident report."
      />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">

        {/* Lookup form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-muted-foreground" />
              Look Up Your Report
            </CardTitle>
            <CardDescription>
              Enter the reference number from your confirmation email along with the email address you used when submitting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ref">Reference Number</Label>
                  <Input
                    id="ref"
                    placeholder="e.g. IR-1234567890"
                    value={incidentId}
                    onChange={e => setIncidentId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLookup()}
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Your Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLookup()}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleLookup} disabled={loading} className="w-full sm:w-auto">
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Looking up…</>
                  : <><Search className="mr-2 h-4 w-4" />Check Status</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {data && statusCfg && (
          <div className="space-y-4">

            {/* Status banner */}
            <Card className={`border-2 ${statusCfg.color}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-full ${statusCfg.color}`}>
                    {statusCfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{data.incidentId}</span>
                    </div>
                    <h2 className="font-semibold text-lg mt-0.5 leading-snug">{data.incidentTitle}</h2>
                    <p className="text-sm mt-1">{statusCfg.description}</p>
                    {data.resolvedAt && (
                      <p className="text-xs mt-1.5 text-muted-foreground">
                        Resolved {new Date(data.resolvedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress stepper */}
                <div className="mt-5">
                  <StatusStepper status={data.status} />
                </div>
              </CardContent>
            </Card>

            {/* Incident summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Report Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Incident date: <span className="text-foreground font-medium">{data.incidentDate}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>Location: <span className="text-foreground font-medium">{data.incidentLocation}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>Submitted: <span className="text-foreground font-medium">{new Date(data.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>Last updated: <span className="text-foreground font-medium">{new Date(data.updatedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span></span>
                </div>
                {data.assignedTo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bell className="h-3.5 w-3.5 shrink-0" />
                    <span>Assigned to: <span className="text-foreground font-medium">{data.assignedTo}</span></span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resolution */}
            {data.resolution && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1.5">Resolution</p>
                  <p className="text-sm text-green-900">{data.resolution}</p>
                </CardContent>
              </Card>
            )}

            {/* Updates from council */}
            {data.updates.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Updates ({data.updates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {data.updates.map(update => (
                    <div key={update.id} className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                      <p className="text-blue-900 whitespace-pre-wrap">{update.body}</p>
                      <p className="text-xs text-blue-500 mt-1.5">
                        {new Date(update.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Status history */}
            {data.statusHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="relative pl-4 space-y-3">
                    <div className="absolute left-1.5 top-1 bottom-1 w-px bg-gray-200" />
                    {data.statusHistory.map((h, i) => {
                      const toCfg = STATUS_CONFIG[h.toStatus] ?? STATUS_CONFIG['NEW'];
                      return (
                        <div key={i} className="relative flex gap-3 items-start text-sm">
                          <span className="absolute -left-3 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-gray-400 ring-1 ring-gray-300" />
                          <div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(h.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <div className="mt-0.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${toCfg.color}`}>
                                {toCfg.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />
            <p className="text-xs text-muted-foreground text-center pb-4">
              Have questions about your report? Contact the strata council directly and reference <span className="font-mono font-semibold">{data.incidentId}</span>.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
