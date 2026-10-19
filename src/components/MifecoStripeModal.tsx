import React from 'react';
import { User } from '../types';
import { X, CreditCard, ArrowRight } from 'lucide-react';

interface MifecoStripeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: User) => void;
    initialEmail?: string;
}

// Purchases use the same MIFECO entry point as the Harness Lab.
// Opening this page never authenticates a user or grants an entitlement.
export const MifecoStripeModal: React.FC<MifecoStripeModalProps> = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
            onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="mifeco-billing-title"
                className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl my-auto">
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                        <h3 id="mifeco-billing-title" className="text-lg font-bold text-white">PM Accelerator subscriptions</h3>
                    </div>
                    <button type="button" onClick={onClose} autoFocus aria-label="Close subscription details"
                        className="p-2 rounded-xl text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="p-6 space-y-4 text-sm text-slate-300">
                    <p>Review current plans and subscription terms on MIFECO. Payment details are entered only on Stripe's hosted checkout.</p>
                    <p>Sign in to your application account before opening Stripe. Access is activated only after your payment is verified.</p>
                    <a href="/?subscribe=1"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400">
                        Open subscription access <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </a>
                    <p className="text-xs text-slate-400">Use your existing application sign-in to check access.</p>
                </div>
            </section>
        </div>
    );
};

