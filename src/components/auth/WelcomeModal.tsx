import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WelcomeModalProps {
  displayName: string;
  onAcknowledge: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ displayName, onAcknowledge }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in fade-in duration-200">
        <div className="bg-gradient-to-r from-[#1a6fb5] to-[#155a94] px-6 py-5">
          <h2 className="text-xl font-bold text-white">
            Welcome {displayName}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Quote and Bid Management Test Environment
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              Please ensure that you only enter in test data on fictional parts and customers.
              Do not enter in any personal or proprietary information into this test environment.
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onAcknowledge}
            autoFocus
            className="w-full bg-[#1a6fb5] hover:bg-[#155a94] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-[#1a6fb5] focus:ring-offset-2"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
