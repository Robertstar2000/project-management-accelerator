import React, { useState } from 'react';
import { User } from '../types';
import { 
    X, 
    CreditCard, 
    ShieldCheck, 
    Check, 
    Zap, 
    Sparkles, 
    Lock, 
    FileText, 
    Cpu, 
    Users, 
    BarChart3, 
    Loader2, 
    ArrowRight,
    CheckCircle2
} from 'lucide-react';

interface MifecoStripeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: User) => void;
    initialEmail?: string;
}

export const MifecoStripeModal: React.FC<MifecoStripeModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialEmail = ''
}) => {
    const [planType, setPlanType] = useState<'monthly' | 'annual'>('monthly');
    const [email, setEmail] = useState(initialEmail);
    const [name, setName] = useState('');
    const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
    const [cardExpiry, setCardExpiry] = useState('12/28');
    const [cardCvc, setCardCvc] = useState('888');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const price = planType === 'monthly' ? '$49' : '$490';
    const period = planType === 'monthly' ? '/ month' : '/ year';

    const handleStripeCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) {
            setError('Please enter your work or account email address.');
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Create checkout intent with Stripe authority
            const intentRes = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    username: name || email.split('@')[0],
                    planType
                })
            });
            const intentData = await intentRes.json();

            // 2. Confirm and verify payment via Stripe authority
            const confirmRes = await fetch('/api/stripe/confirm-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    username: name || email.split('@')[0],
                    sessionId: intentData.sessionId,
                    planType
                })
            });

            const confirmData = await confirmRes.json();
            if (!confirmRes.ok || !confirmData.success) {
                throw new Error(confirmData.error || 'Payment authority verification failed.');
            }

            setPaymentSuccess(confirmData);

            // Automatically log in the user after brief celebration
            setTimeout(() => {
                onSuccess(confirmData.user);
                onClose();
            }, 1400);
        } catch (err: any) {
            console.error('Stripe Checkout Error:', err);
            setError(err.message || 'Payment processing failed. Please verify credentials.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden my-auto">
                
                {/* Header with Stripe Branding */}
                <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                    PM Accelerator Business Access
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Stripe Authority
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                PM Accelerator Business Tier: Pre-provisioned enterprise AI via MIFECO business Stripe authority.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {paymentSuccess ? (
                        <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-white">Payment Confirmed!</h4>
                            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                                {paymentSuccess.message}
                            </p>
                            <div className="text-[11px] font-mono text-cyan-400">
                                Receipt ID: {paymentSuccess.receiptNumber}
                            </div>
                            <div className="text-xs text-slate-400 pt-2 flex items-center justify-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                                <span>Launching your Business Workspace...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Plan Pricing Toggle */}
                            <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPlanType('monthly')}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                                        planType === 'monthly'
                                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Monthly: $49 / mo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPlanType('annual')}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                                        planType === 'annual'
                                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <span>Annual: $490 / yr</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                        Save 17%
                                    </span>
                                </button>
                            </div>

                            {/* Plan Highlights */}
                            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Included with Business Authority:
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span><strong>Pre-Provisioned Enterprise AI</strong> (Gemini 2.5 Pro & GPT-4o without personal keys)</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span><strong>4-Agent Automated Workflow</strong> (Instant timeline, role, and budget synthesis)</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span><strong>Executive PDF & JSON Summary Exports</strong> for external stakeholders</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span><strong>Priority SLA & Zero Cloud Egress</strong> security controls</span>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleStripeCheckout} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-400">
                                            Work Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            placeholder="you@company.com"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-slate-400">
                                            Account Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="e.g. Lead Program Manager"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <label className="font-semibold text-slate-400 flex items-center gap-1.5">
                                            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>Card Details (Stripe Authority Sandbox)</span>
                                        </label>
                                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" />
                                            <span>256-Bit Encrypted</span>
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                        <input
                                            type="text"
                                            value={cardNumber}
                                            onChange={e => setCardNumber(e.target.value)}
                                            placeholder="4242 4242 4242 4242"
                                            className="w-full bg-transparent text-white text-xs font-mono outline-none tracking-wider"
                                        />
                                        <div className="flex gap-4 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <span>Exp:</span>
                                                <input
                                                    type="text"
                                                    value={cardExpiry}
                                                    onChange={e => setCardExpiry(e.target.value)}
                                                    className="w-14 bg-transparent text-white font-mono outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span>CVC:</span>
                                                <input
                                                    type="text"
                                                    value={cardCvc}
                                                    onChange={e => setCardCvc(e.target.value)}
                                                    className="w-10 bg-transparent text-white font-mono outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                                        {error}
                                    </div>
                                )}

                                <div className="pt-2 flex flex-col gap-2.5">
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Verifying with Stripe Authority...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-3.5 h-3.5" />
                                                <span>Pay {price} & Unlock Business Tier</span>
                                            </>
                                        )}
                                    </button>

                                    <a
                                        href="https://buy.stripe.com/test_pm_accelerator_business"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all text-center"
                                    >
                                        <span>Or Open Direct Stripe Checkout Payment Link</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                                    </a>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* Footer Security Guarantee */}
                <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Powered by Stripe Authority</span>
                    </span>
                    <span>Cancel or switch anytime</span>
                </div>
            </div>
        </div>
    );
};
