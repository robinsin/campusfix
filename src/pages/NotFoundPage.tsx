import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-chalk flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg border border-slate-200 shadow-lg space-y-4">
        <div className="w-14 h-14 rounded-full bg-orange-100 text-site-orange flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <span className="font-mono-data text-xs font-bold text-site-orange uppercase tracking-wider block">
          Error 404 — Page Not Found
        </span>
        <h1 className="text-3xl font-black font-heading text-ledger-navy">Looking for something?</h1>
        <p className="text-sm text-ink/70">
          The requested page or work order route does not exist on the CampusFix portal.
        </p>

        <div className="pt-4">
          <Link
            to="/app"
            className="px-5 py-2.5 bg-worn-gold hover:bg-worn-gold/90 text-ledger-navy font-bold text-sm rounded shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
