import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldCheck, ClipboardList, CheckSquare, BarChart2, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-chalk flex flex-col text-black">
      {/* Top Header Bar — White background with black logo text, icon & links */}
      <header className="bg-white text-black py-4 px-6 border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-worn-gold text-black flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4 text-black" />
            </div>
            <span className="font-heading text-xl font-black tracking-tight text-black">CampusFix</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-black hover:text-worn-gold transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-bold bg-worn-gold hover:bg-worn-gold/90 text-black rounded shadow-xs transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Utility Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-100 text-black text-xs font-bold font-mono-data mb-6 border border-worn-gold/30">
          <ShieldCheck className="w-4 h-4 text-worn-gold" />
          <span>Official University Facilities Service Portal</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black font-heading text-black max-w-3xl leading-tight">
          Single place for campus maintenance, repairs & facility requests.
        </h1>

        <p className="text-lg text-black/80 font-medium max-w-2xl mt-4 leading-relaxed">
          Replacing phone calls, paper forms, WhatsApp messages, and desk visits. Report electrical, plumbing, IT, or furniture issues and track them to resolution.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link
            to="/login"
            className="px-6 py-3.5 bg-worn-gold hover:bg-worn-gold/90 text-black font-bold rounded-lg shadow-md transition-all flex items-center gap-2 text-base"
          >
            <span>Log In to Portal</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/register"
            className="px-6 py-3.5 bg-white hover:bg-slate-50 text-black font-bold rounded-lg shadow-md transition-all text-base border border-slate-300"
          >
            Register Student / Staff Account
          </Link>
        </div>

        {/* Three Roles in One Glance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-16 text-left">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded bg-chalk text-black flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5 text-worn-gold" />
            </div>
            <h3 className="font-heading font-bold text-lg text-black">1. Students & Staff</h3>
            <p className="text-sm text-black/80 font-medium">
              Submit requests with evidence photos, track status timeline in real-time, and get notified on completion.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded bg-chalk text-black flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5 text-worn-gold" />
            </div>
            <h3 className="font-heading font-bold text-lg text-black">2. Maintenance Officers</h3>
            <p className="text-sm text-black/80 font-medium">
              Work assigned queues sorted by priority & age, acknowledge work orders, and upload completion photos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded bg-chalk text-black flex items-center justify-center font-bold">
              <BarChart2 className="w-5 h-5 text-worn-gold" />
            </div>
            <h3 className="font-heading font-bold text-lg text-black">3. Administrators</h3>
            <p className="text-sm text-black/80 font-medium">
              Oversee whole queue, reassign officers, manage user roles, track category analytics, and export CSV/PDF reports.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-black font-medium font-mono-data">
        CampusFix Maintenance Portal • MIT 8333 Assessment Project
      </footer>
    </div>
  );
};
