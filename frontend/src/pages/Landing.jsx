import { Link } from 'react-router-dom';
import { ShaderAnimation } from '../components/ui/ShaderAnimation';
import { GlowingEffect } from '../components/ui/GlowingEffect';
import { Zap, Users, Receipt, CreditCard, Bell, BarChart2, Shield, ArrowRight, CheckCircle } from 'lucide-react';

const FEATURES = [
  { icon: Receipt, title: 'Smart Expense Splitting', desc: 'Split equally, by percentage, exact amounts, or custom shares. Every scenario covered.' },
  { icon: Users, title: 'Group Management', desc: 'Create unlimited groups for trips, home, events, and projects. Invite members instantly.' },
  { icon: CreditCard, title: 'Integrated Payments', desc: 'Pay directly via Razorpay or UPI QR code without leaving the app.' },
  { icon: Bell, title: 'Realtime Notifications', desc: 'Instant updates when someone adds an expense or settles a payment.' },
  { icon: BarChart2, title: 'Analytics & Reports', desc: 'Visualise spending patterns by category, month, and group member.' },
  { icon: Shield, title: 'Bank-grade Security', desc: 'JWT authentication, encrypted data, and secure payment handling via Razorpay.' },
];

const STEPS = [
  { n: '01', title: 'Create a Group', desc: 'Add your friends, roommates, or travel buddies in seconds.' },
  { n: '02', title: 'Log Expenses', desc: 'Record who paid and choose how to split equal, percentage, or custom.' },
  { n: '03', title: 'Settle Up', desc: 'Our algorithm minimises transactions. Pay directly via UPI or Razorpay.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-white">SplitKar</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Shader background */}
        <ShaderAnimation />

        {/* Dark overlay so text is readable */}
        <div className="absolute inset-0 bg-black/50 z-0" />

        {/* All hero content — add z-10 to sit above shader */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 animate-fade-in">
            <Zap size={14} />
            Built for India · INR · UPI
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Split expenses.<br />
            <span className="text-brand-400">Not friendships.</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10 animate-slide-up">
            SplitKar is the smartest way for Indian groups to track shared expenses, split bills fairly,
            and settle up instantly all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 animate-slide-up">
            <Link to="/register" className="btn-primary flex items-center gap-2 px-6 py-3 text-base">
              Start for free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center gap-2 px-6 py-3 text-base">
              Sign in
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-12 text-slate-400 text-sm">
            {['No credit card required', 'Free to use', 'Realtime sync'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
          <CheckCircle size={14} className="text-brand-500" /> {t}
        </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-white text-center mb-12">How SplitKar works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="card p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 font-display text-5xl font-bold text-white/[0.04]">{n}</div>
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 font-display font-bold text-sm mb-4">
                {n}
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      {/*<section className="px-6 py-16 max-w-5xl mx-auto">*/}
      {/*  <h2 className="font-display text-3xl font-bold text-white text-center mb-4">Everything you need</h2>*/}
      {/*  <p className="text-slate-400 text-center mb-12">All the tools to manage shared finances, without the spreadsheet headaches.</p>*/}
      {/*  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">*/}
      {/*    {FEATURES.map(({ icon: Icon, title, desc }) => (*/}
      {/*      <div key={title} className="card p-5 hover:border-brand-500/20 transition-all duration-300 group">*/}
      {/*        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-500/20 transition-colors">*/}
      {/*          <Icon size={20} />*/}
      {/*        </div>*/}
      {/*        <h3 className="font-semibold text-white mb-2">{title}</h3>*/}
      {/*        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>*/}
      {/*      </div>*/}
      {/*    ))}*/}
      {/*  </div>*/}
      {/*</section>*/}
      <section id="features" className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-white text-center mb-4">
          Everything you need
        </h2>
        <p className="text-slate-400 text-center mb-12">
          All the tools to manage shared finances, without the spreadsheet headaches.
        </p>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:grid-rows-2">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => {
            const areas = [
              "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]",
              "md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]",
              "md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]",
              "md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]",
              "md:[grid-area:3/1/4/7] xl:[grid-area:2/8/3/13]",
              "md:[grid-area:3/7/4/13] xl:[grid-area:2/8/3/13]",
            ];
            return (
                <li key={title} className={`min-h-[14rem] list-none ${areas[i] || ''}`}>
                  <div className="relative h-full rounded-[1.25rem] border border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
                    <GlowingEffect
                        spread={40}
                        glow={true}
                        disabled={false}
                        proximity={64}
                        inactiveZone={0.01}
                        borderWidth={2}
                    />
                    <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-slate-900/80 border border-white/[0.06] p-6 shadow-sm backdrop-blur-sm">
                      <div className="relative flex flex-1 flex-col justify-between gap-3">
                        <div className="w-fit rounded-xl border border-brand-500/20 bg-brand-500/10 p-2.5">
                          <Icon size={20} className="text-brand-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-white leading-snug">
                            {title}
                          </h3>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
            );
          })}
        </ul>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="card max-w-2xl mx-auto p-10 border-brand-500/15">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/30">
            <Zap size={28} className="text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-3">Ready to split smarter?</h2>
          <p className="text-slate-400 mb-8">Join thousands of Indian groups already using SplitKar to manage shared expenses.</p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base">
            Create free account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8 text-center text-slate-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Zap size={12} className="text-brand-400" />
          </div>
          <span className="text-slate-400 font-medium">SplitKar</span>
        </div>
        <p>Built with ❤️ by SplitKar team.</p>
      </footer>
    </div>
  );
}
