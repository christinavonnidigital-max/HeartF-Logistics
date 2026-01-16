import React from "react";
import { Lead } from "../types";

interface LeadFinderModalProps {
  onClose: () => void;
  onImport: (leads: Omit<Lead, "id" | "created_at" | "updated_at" | "lead_score">[]) => void;
}

// Archived copy retained for compatibility; not used in the main app build.
const LeadFinderModal: React.FC<LeadFinderModalProps> = ({ onClose }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow border border-slate-200 max-w-md w-full">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Lead Finder (archived)</h2>
      <p className="text-sm text-slate-600">
        This legacy component is kept only for reference in the Heartfledge-CRM copy. The active implementation lives
        in the main app.
      </p>
      <button
        onClick={onClose}
        className="mt-4 px-3 py-2 rounded-md bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
      >
        Close
      </button>
    </div>
  );
};

export default LeadFinderModal;
