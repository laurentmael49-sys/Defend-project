import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const slides = [
  {
    badge: 'Real-Time Inventory',
    title: 'Complete Visibility Over All Corporate Assets',
    description: 'Track laptops, smartphones, workstation monitors, and software licenses in one centralized, high-speed dashboard with live status indicators.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    metric: '100%',
    metricLabel: 'Audit Readiness',
    linkText: 'Explore Inventory',
    linkTo: '/register'
  },
  {
    badge: 'Automated Loan Requests',
    title: 'Seamless Equipment Borrowing & Instant Approvals',
    description: 'Employees submit loan requests in seconds. IT managers inspect, approve, and track return dates automatically with automated reminder alerts.',
    icon: (
      <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    metric: '0%',
    metricLabel: 'Unaccounted Devices',
    linkText: 'Borrow Equipment',
    linkTo: '/register'
  },
  {
    badge: 'Security & Compliance',
    title: 'Enterprise Audit Trail & Live Security Intelligence',
    description: 'Every custody change, maintenance log, and administrator action is recorded in immutable live audit logs with instant CSV/JSON report exports.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    metric: '24/7',
    metricLabel: 'Chain of Custody Tracking',
    linkText: 'View Audit Demo',
    linkTo: '/register'
  }
];

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen bg-emerald-50/30 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1">

        {/* Hero Section */}
        <div className="relative pt-32 pb-16 sm:pt-36 sm:pb-20 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-200/40 via-emerald-50/20 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
              Streamline Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Asset Management</span>
            </h1>
            <p className="max-w-2xl text-lg md:text-xl text-slate-600 font-medium mx-auto mb-8">
              The enterprise solution for tracking inventory, managing equipment loans, and generating real-time audit intelligence.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                to="/register" 
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <a 
                href="#slideshow" 
                className="px-8 py-3.5 rounded-2xl bg-white text-slate-700 font-bold shadow-md shadow-emerald-950/5 border border-emerald-100 hover:bg-emerald-50/50 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Interactive Feature Slider / Carousel */}
        <div id="slideshow" className="py-12 bg-gradient-to-b from-white to-emerald-50/40 border-y border-emerald-100/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-100/80 px-3 py-1 rounded-full">Platform Highlights</span>
              <h2 className="text-3xl font-black text-slate-900 mt-3 sm:text-4xl">Key Platform Capabilities</h2>
            </div>

            {/* Carousel Container Card */}
            <div className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-emerald-950/5 border border-emerald-100/80 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                {/* Left Slide Content */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                      {slides[currentSlide].icon}
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                      {slides[currentSlide].badge}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {slides[currentSlide].title}
                  </h3>

                  <p className="text-slate-600 text-base leading-relaxed font-medium">
                    {slides[currentSlide].description}
                  </p>

                  <div className="pt-2">
                    <Link
                      to={slides[currentSlide].linkTo}
                      className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-600 hover:text-emerald-800 transition"
                    >
                      <span>{slides[currentSlide].linkText}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Right Slide Metric Highlight Card */}
                <div className="lg:col-span-4 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl p-8 text-white text-center shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center">
                  <div className="text-5xl font-black mb-2 tracking-tight">{slides[currentSlide].metric}</div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-100">{slides[currentSlide].metricLabel}</div>
                </div>

              </div>

              {/* Slider Controls & Indicators */}
              <div className="mt-8 pt-6 border-t border-emerald-50 flex items-center justify-between">
                
                {/* Dots */}
                <div className="flex items-center gap-2">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        currentSlide === idx ? 'w-8 bg-emerald-600' : 'w-2.5 bg-emerald-200 hover:bg-emerald-300'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Arrow Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition border border-emerald-100"
                    title="Previous Slide"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition border border-emerald-100"
                    title="Next Slide"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Features / Solutions Section */}
        <div id="solutions" className="py-20 bg-white border-b border-emerald-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">Everything you need to manage assets</h2>
              <p className="mt-4 text-base font-medium text-slate-600">Discover our powerful features designed to make IT asset management effortless.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="bg-emerald-50/30 rounded-3xl p-8 border border-emerald-100 shadow-lg shadow-emerald-950/5 hover:border-emerald-200 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Inventory Tracking</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Keep a real-time record of all your hardware and software assets. Categorize, track statuses, and never lose sight of your equipment.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-emerald-50/30 rounded-3xl p-8 border border-emerald-100 shadow-lg shadow-emerald-950/5 hover:border-emerald-200 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-6 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Loan Management</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Employees can request equipment easily. IT managers can approve, track return dates, and manage the entire lifecycle of a loan.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-emerald-50/30 rounded-3xl p-8 border border-emerald-100 shadow-lg shadow-emerald-950/5 hover:border-emerald-200 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Analytics & Reports</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Generate comprehensive reports on asset utilization, loan history, and maintenance needs. Make data-driven decisions.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Live Audit Log Example */}
        <div className="py-20 bg-emerald-50/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 sm:text-4xl mb-6">Live Audit Logging</h2>
                <p className="text-base text-slate-600 mb-8 font-medium">
                  Every action is recorded in real-time. From asset creation to status changes, you always have a complete, transparent history of what happened, when, and by whom.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center text-sm font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mr-3 text-xs">✓</span>
                    Track chain of custody for valuable equipment
                  </li>
                  <li className="flex items-center text-sm font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mr-3 text-xs">✓</span>
                    Ensure compliance with company security standards
                  </li>
                  <li className="flex items-center text-sm font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mr-3 text-xs">✓</span>
                    Identify anomalies and prevent loss
                  </li>
                </ul>
              </div>
              <div className="mt-12 lg:mt-0">
                <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono">audit-stream.log</span>
                  </div>
                  <div className="p-6 bg-slate-900 font-mono text-xs text-slate-200 space-y-4 h-64 overflow-hidden relative">
                    <div className="flex space-x-3 text-slate-400">
                      <span className="text-slate-500">[10:41:22]</span>
                      <span className="text-emerald-400 font-bold">INFO</span>
                      <span>User jdoe requested asset #1042 (MacBook Pro)</span>
                    </div>
                    
                    <div className="flex space-x-3 text-slate-300">
                      <span className="text-slate-500">[10:42:05]</span>
                      <span className="text-emerald-400 font-bold">INFO</span>
                      <span>User admin approved request for asset #1042</span>
                    </div>
                    
                    <div className="flex space-x-3 text-amber-300">
                      <span className="text-slate-500">[10:42:06]</span>
                      <span className="text-amber-400 font-bold">WARN</span>
                      <span>Status change: Asset #1042 available &rarr; loaned</span>
                    </div>
                    
                    <div className="flex space-x-3 text-white border-l-2 border-emerald-500 pl-3 bg-slate-800 py-1.5 rounded-r-xl">
                      <span className="text-slate-500">[10:45:11]</span>
                      <span className="text-emerald-400 font-bold">SUCCESS</span>
                      <span>New asset added: #1045 (Dell XPS 15) by admin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="py-20 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black sm:text-4xl">How It Works</h2>
              <p className="mt-4 text-base text-slate-400 font-medium">A seamless workflow for both employees and management.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-emerald-500/25">1</div>
                <h4 className="text-xl font-bold mb-3">Request</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Employees browse the available inventory and submit a request for the equipment they need.</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-emerald-500/25">2</div>
                <h4 className="text-xl font-bold mb-3">Approve</h4>
                <p className="text-slate-400 text-sm leading-relaxed">IT managers review requests, assign specific assets, and approve the loan with designated return dates.</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-emerald-500/25">3</div>
                <h4 className="text-xl font-bold mb-3">Track</h4>
                <p className="text-slate-400 text-sm leading-relaxed">The system automatically tracks the loan status and notifies users when returns or maintenance are due.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-xs font-semibold">© 2026 Asset Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
