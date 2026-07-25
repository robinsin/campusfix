import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCategories, createRequest } from '../../lib/api';
import type { Category, Priority } from '../../types';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

const newRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  category_id: z.string().min(1, 'Please select a category'),
  location: z.string().min(3, 'Location (building & room) is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  description: z.string().min(15, 'Description must be at least 15 characters long'),
});

type NewRequestFormValues = z.infer<typeof newRequestSchema>;

export const NewRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewRequestFormValues>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const onSubmit = async (data: NewRequestFormValues) => {
    setSubmitting(true);
    try {
      const created = await createRequest({
        title: data.title,
        category_id: data.category_id,
        location: data.location,
        priority: data.priority as Priority,
        description: data.description,
        evidence_files: evidenceFiles,
      });

      toast.success(`Request ${created.ticket_no} submitted successfully!`);
      navigate(`/app/requests/${created.id}`);
    } catch (err) {
      toast.error("Couldn't save — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Back Button */}
      <div>
        <Link
          to="/app/requests"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ledger-navy hover:text-worn-gold transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Requests</span>
        </Link>
        <h1 className="text-3xl font-black font-heading text-ledger-navy">Report Facilities Issue</h1>
        <p className="text-sm text-ink/70 mt-1">
          Submit a maintenance request for quick action by the campus operations team.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
        {/* Issue Title */}
        <div>
          <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
            Issue Title *
          </label>
          <input
            type="text"
            {...register('title')}
            className={`w-full px-3 py-2 bg-chalk border rounded text-sm text-ink focus-visible:outline-none ${
              errors.title ? 'border-site-orange' : 'border-slate-300'
            }`}
            placeholder="e.g. Water Leak under sink or Fluorescent tube flickering"
          />
          {errors.title && <p className="text-xs text-site-orange mt-1 font-medium">{errors.title.message}</p>}
        </div>

        {/* Category & Suggested Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              Category *
            </label>
            <select
              {...register('category_id')}
              className={`w-full px-3 py-2 bg-chalk border rounded text-sm text-ink focus-visible:outline-none ${
                errors.category_id ? 'border-site-orange' : 'border-slate-300'
              }`}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-xs text-site-orange mt-1 font-medium">{errors.category_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
              Suggested Priority *
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink focus-visible:outline-none"
            >
              <option value="low">Low — Routine cosmetic maintenance</option>
              <option value="medium">Medium — Normal repair required</option>
              <option value="high">High — Disrupting daily study/work</option>
              <option value="urgent">Urgent — Immediate hazard / water overflow</option>
            </select>
            <p className="text-[11px] text-ink/60 mt-1">Requester suggestion; can be adjusted by facility admin.</p>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
            Exact Location (Building + Room / Corridor) *
          </label>
          <input
            type="text"
            {...register('location')}
            className={`w-full px-3 py-2 bg-chalk border rounded text-sm text-ink focus-visible:outline-none ${
              errors.location ? 'border-site-orange' : 'border-slate-300'
            }`}
            placeholder="e.g. Science Building - Lab 204 or Hall 4 - Rm 302"
          />
          {errors.location && (
            <p className="text-xs text-site-orange mt-1 font-medium">{errors.location.message}</p>
          )}
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
            Detailed Description *
          </label>
          <textarea
            rows={4}
            {...register('description')}
            className={`w-full px-3 py-2 bg-chalk border rounded text-sm text-ink focus-visible:outline-none ${
              errors.description ? 'border-site-orange' : 'border-slate-300'
            }`}
            placeholder="Describe what is broken, what happened, and any specific safety or access notes..."
          />
          {errors.description && (
            <p className="text-xs text-site-orange mt-1 font-medium">{errors.description.message}</p>
          )}
        </div>

        {/* Evidence Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
            Evidence Photos (Optional, up to 3)
          </label>
          <FileDropzone
            files={evidenceFiles}
            onChange={setEvidenceFiles}
            maxFiles={3}
            maxSizeMB={5}
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Link
            to="/app/requests"
            className="px-4 py-2.5 text-sm font-semibold text-ink bg-chalk hover:bg-slate-200 border border-slate-300 rounded transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-worn-gold hover:bg-worn-gold/90 text-ledger-navy font-bold text-sm rounded shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-ledger-navy border-t-transparent rounded-full animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Work Order</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
