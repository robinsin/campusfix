import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  getRequestById,
  getStatusLogs,
  updateRequestStatus,
  assignRequest,
  overridePriority,
  cancelRequest,
  listUsers
} from '../../lib/api';
import type { ServiceRequest, StatusLog, User, RequestStatus, Priority } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Timeline } from '../../components/ui/Timeline';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FileDropzone } from '../../components/ui/FileDropzone';
import {
  ArrowLeft,
  User as UserIcon,
  MapPin,
  Calendar,
  Wrench,
  MessageSquare,
  CheckCircle2,
  UserPlus,
  XCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Action states
  const [statusNote, setStatusNote] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState<RequestStatus | ''>('');
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [reqData, logData, userList] = await Promise.all([
        getRequestById(id),
        getStatusLogs(id),
        listUsers(),
      ]);
      setRequest(reqData);
      setLogs(logData);
      setOfficers(userList.filter((u) => u.role_id === 'officer' && u.is_active));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-worn-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold font-heading text-ledger-navy">Work Order Not Found</h2>
        <p className="text-sm text-ink/70 mt-1 mb-4">No request matching ID "{id}".</p>
        <Link to="/app/requests" className="px-4 py-2 bg-worn-gold text-ledger-navy font-bold text-sm rounded">
          Return to Requests
        </Link>
      </div>
    );
  }

  const isStudent = currentUser?.role_id === 'student_staff';
  const isOfficer = currentUser?.role_id === 'officer';
  const isAdmin = currentUser?.role_id === 'admin';

  // Handle Status Update
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewStatus) return;
    if (!statusNote.trim()) {
      toast.error('Note is required explaining the status change');
      return;
    }

    setStatusUpdating(true);
    try {
      let photoUrl: string | undefined;
      if (completionFiles.length > 0) {
        photoUrl = URL.createObjectURL(completionFiles[0]);
      }

      const updated = await updateRequestStatus(request.id, selectedNewStatus, statusNote, photoUrl);
      setRequest(updated);

      // Reload history logs
      const updatedLogs = await getStatusLogs(request.id);
      setLogs(updatedLogs);

      if (selectedNewStatus === 'resolved') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        toast.success(`Marked resolved — Work Order ${request.ticket_no} completed!`);
      } else {
        toast.success(`Status updated to ${selectedNewStatus.replace('_', ' ').toUpperCase()}`);
      }

      setStatusNote('');
      setSelectedNewStatus('');
      setCompletionFiles([]);
    } catch (err) {
      toast.error('Failed to update status. Please try again.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle Officer Reassignment
  const handleAssignOfficer = async () => {
    if (!selectedOfficerId) return;
    setAssigning(true);
    try {
      const updated = await assignRequest(request.id, selectedOfficerId);
      setRequest(updated);

      const updatedLogs = await getStatusLogs(request.id);
      setLogs(updatedLogs);

      toast.success(`Assigned to officer ${updated.assigned_officer?.full_name}`);
      setReassignModalOpen(false);
    } catch (err) {
      toast.error('Failed to assign officer');
    } finally {
      setAssigning(false);
    }
  };

  // Handle Student Comment / More Info
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      await updateRequestStatus(request.id, request.status, `Note from requester: ${commentText}`);
      const updatedLogs = await getStatusLogs(request.id);
      setLogs(updatedLogs);
      toast.success('Additional note logged to work order timeline');
      setCommentText('');
      setCommentModalOpen(false);
    } finally {
      setCommenting(false);
    }
  };

  // Handle Request Cancellation
  const handleCancelRequest = async () => {
    setCancelling(true);
    try {
      const updated = await cancelRequest(request.id, 'Cancelled by requester');
      setRequest(updated);
      const updatedLogs = await getStatusLogs(request.id);
      setLogs(updatedLogs);
      toast.success(`Ticket ${request.ticket_no} cancelled.`);
      setCancelDialogOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  // Handle Priority Override
  const handlePriorityChange = async (newP: Priority) => {
    try {
      const updated = await overridePriority(request.id, newP);
      setRequest(updated);
      const updatedLogs = await getStatusLogs(request.id);
      setLogs(updatedLogs);
      toast.success(`Priority set to ${newP.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update priority');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ledger-navy hover:text-worn-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to List</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Ticket Stub structural element */}
          <span className="font-mono-data text-xs font-bold px-3 py-1 bg-ledger-navy text-white rounded">
            Ticket #{request.ticket_no}
          </span>
        </div>
      </div>

      {/* Main Ticket Summary Block (§6) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Ticket Title Banner */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                {request.category_name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-ledger-navy pt-1">
              {request.title}
            </h1>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 shrink-0">
            {isStudent && request.status !== 'resolved' && request.status !== 'cancelled' && (
              <>
                <button
                  onClick={() => setCommentModalOpen(true)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-ledger-navy text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Add Info</span>
                </button>
                <button
                  onClick={() => setCancelDialogOpen(true)}
                  className="px-3 py-1.5 bg-orange-50 border border-orange-200 hover:bg-orange-100 text-site-orange text-xs font-bold rounded flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Request</span>
                </button>
              </>
            )}

            {isAdmin && (
              <button
                onClick={() => setReassignModalOpen(true)}
                className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-white" />
                <span>Reassign Officer</span>
              </button>
            )}
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Requester</span>
            <div className="flex items-center gap-1.5 text-ledger-navy font-semibold">
              <UserIcon className="w-3.5 h-3.5 text-worn-gold" />
              <span>{request.requester?.full_name || 'Student'}</span>
            </div>
            <span className="text-[11px] text-ink/60 block">{request.requester?.email}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Assigned Officer</span>
            <div className="flex items-center gap-1.5 text-ledger-navy font-semibold">
              <Wrench className="w-3.5 h-3.5 text-worn-gold" />
              <span>{request.assigned_officer?.full_name || 'Unassigned'}</span>
            </div>
            <span className="text-[11px] text-ink/60 block">
              {request.assigned_officer?.department_or_hostel || 'Awaiting dispatch'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Location</span>
            <div className="flex items-center gap-1.5 text-ledger-navy font-semibold">
              <MapPin className="w-3.5 h-3.5 text-worn-gold" />
              <span>{request.location}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Submitted Date</span>
            <div className="flex items-center gap-1.5 text-ledger-navy font-semibold font-mono-data">
              <Calendar className="w-3.5 h-3.5 text-worn-gold" />
              <span>{new Date(request.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>
        </div>

        {/* Admin Priority Override Toolbar */}
        {isAdmin && (
          <div className="px-6 py-2 bg-amber-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-ledger-navy flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-worn-gold" />
              Admin Priority Override:
            </span>
            <div className="flex items-center gap-1.5">
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriorityChange(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    request.priority === p
                      ? 'bg-ledger-navy text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Request Description & Evidence Photos */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-heading uppercase text-slate-400 tracking-wider mb-1">
              Issue Description
            </h3>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-line bg-chalk p-4 rounded border border-slate-200">
              {request.description}
            </p>
          </div>

          {/* Evidence Photo Gallery */}
          {request.evidence_urls && request.evidence_urls.length > 0 && (
            <div>
              <h3 className="text-sm font-bold font-heading uppercase text-slate-400 tracking-wider mb-2">
                Evidence Photos ({request.evidence_urls.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {request.evidence_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded border border-slate-200 overflow-hidden bg-slate-100 aspect-video hover:opacity-95 transition-opacity"
                  >
                    <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Completion Photo Gallery if resolved */}
          {request.completion_photo_url && (
            <div>
              <h3 className="text-sm font-bold font-heading uppercase text-resolved-green tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Work Order Completion Photo
              </h3>
              <div className="max-w-sm rounded border-2 border-resolved-green/40 overflow-hidden aspect-video">
                <img src={request.completion_photo_url} alt="Completion Proof" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Action Panel for Officer & Admin */}
      {(isOfficer || isAdmin) && request.status !== 'cancelled' && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold font-heading text-ledger-navy flex items-center gap-2">
            <Wrench className="w-5 h-5 text-worn-gold" />
            <span>Officer Action Panel — Update Work Order Progress</span>
          </h2>

          <form onSubmit={handleStatusChange} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
                  New Status State *
                </label>
                <select
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value as RequestStatus)}
                  className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink font-medium focus-visible:outline-none"
                  required
                >
                  <option value="">Select Status Action</option>
                  <option value="in_progress">Acknowledge & Start (In Progress)</option>
                  <option value="on_hold">Put On Hold (Awaiting Parts)</option>
                  <option value="resolved">Mark Resolved (Complete Work)</option>
                </select>
              </div>

              {selectedNewStatus === 'resolved' && (
                <div>
                  <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
                    Upload Completion Proof Photo
                  </label>
                  <FileDropzone
                    files={completionFiles}
                    onChange={setCompletionFiles}
                    maxFiles={1}
                    maxSizeMB={5}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
                Progress / Resolution Note *
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Enter mandatory note (e.g. Replaced faulty component and tested water flow...)"
                className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink focus-visible:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={statusUpdating}
              className="px-5 py-2 bg-black hover:bg-slate-800 text-white font-bold text-sm rounded shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {statusUpdating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>Update Work Order Status</span>
            </button>
          </form>
        </div>
      )}

      {/* Chronological Status Audit Timeline */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold font-heading text-ledger-navy flex items-center gap-2">
          <FileText className="w-5 h-5 text-worn-gold" />
          <span>Status Log & Audit History</span>
        </h2>
        <Timeline logs={logs} />
      </div>

      {/* Reassign Officer Modal for Admin */}
      {reassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ledger-navy/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold font-heading text-ledger-navy">Reassign Work Order</h3>
            <p className="text-xs text-ink/70">
              Select a maintenance officer to assign to work order <strong className="font-mono-data">{request.ticket_no}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">Select Officer</label>
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink font-medium"
              >
                <option value="">Select Maintenance Officer</option>
                {officers.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.full_name} — ({off.department_or_hostel || 'Facilities'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-ink bg-chalk hover:bg-slate-200 rounded border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignOfficer}
                disabled={assigning || !selectedOfficerId}
                className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-slate-800 rounded disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {assigning && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Confirm Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Info / Comment Modal */}
      {commentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ledger-navy/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold font-heading text-ledger-navy">Add Additional Information</h3>
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Provide further details or updates for the assigned officer..."
                className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCommentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink bg-chalk rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={commenting}
                  className="px-4 py-2 text-xs font-bold text-ledger-navy bg-worn-gold hover:bg-worn-gold/90 rounded flex items-center gap-1.5"
                >
                  {commenting && <div className="w-3.5 h-3.5 border-2 border-ledger-navy border-t-transparent rounded-full animate-spin" />}
                  <span>Add Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Request Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        title="Cancel Work Order?"
        message={`Are you sure you want to cancel ticket ${request.ticket_no}? This action will stop further maintenance work.`}
        confirmLabel="Yes, Cancel Work Order"
        isDestructive={true}
        loading={cancelling}
        onConfirm={handleCancelRequest}
        onClose={() => setCancelDialogOpen(false)}
      />
    </div>
  );
};
