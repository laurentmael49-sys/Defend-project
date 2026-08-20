import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <main className="flex-1">
        <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-8">
              Streamline Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Asset Management</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-600 mx-auto mb-10">
              The complete solution for tracking inventory, managing employee equipment loans, and generating insightful reports. Built for modern IT teams.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                to="/register" 
                className="px-8 py-3 rounded-full bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <a 
                href="#solutions" 
                className="px-8 py-3 rounded-full bg-white text-slate-700 font-semibold shadow-md border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Features / Solutions Section */}
        <div id="solutions" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Everything you need to manage assets</h2>
              <p className="mt-4 text-lg text-slate-600">Discover our powerful features designed to make IT asset management effortless.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Inventory Tracking</h3>
                <p className="text-slate-600 leading-relaxed">
                  Keep a real-time record of all your hardware and software assets. Categorize, track statuses, and never lose sight of your equipment.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Loan Management</h3>
                <p className="text-slate-600 leading-relaxed">
                  Employees can request equipment easily. IT managers can approve, track return dates, and manage the entire lifecycle of a loan.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Analytics & Reports</h3>
                <p className="text-slate-600 leading-relaxed">
                  Generate comprehensive reports on asset utilization, loan history, and maintenance needs. Make data-driven decisions.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Live Audit Log Example */}
        <div className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-6">Live Audit Logging</h2>
                <p className="text-lg text-slate-600 mb-8">
                  Every action is recorded in real-time. From asset creation to status changes, you always have a complete, transparent history of what happened, when, and by whom.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500 mr-3">✓</span>
                    <span className="text-slate-700">Track chain of custody for valuable equipment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500 mr-3">✓</span>
                    <span className="text-slate-700">Ensure compliance with company policies</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500 mr-3">✓</span>
                    <span className="text-slate-700">Identify anomalies and prevent loss</span>
                  </li>
                </ul>
              </div>
              <div className="mt-12 lg:mt-0">
                <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">audit-stream.log</span>
                  </div>
                  <div className="p-6 bg-slate-900/50 font-mono text-sm text-slate-300 space-y-4 h-64 overflow-hidden relative">
                    <div className="animate-pulse absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-slate-900/90 pointer-events-none"></div>
                    
                    <div className="flex space-x-3 opacity-50 transform translate-y-[-10px]">
                      <span className="text-slate-500">[10:41:22]</span>
                      <span className="text-blue-400">INFO</span>
                      <span>User jdoe requested asset #1042 (MacBook Pro)</span>
                    </div>
                    
                    <div className="flex space-x-3 opacity-75">
                      <span className="text-slate-500">[10:42:05]</span>
                      <span className="text-blue-400">INFO</span>
                      <span>User admin approved request for asset #1042</span>
                    </div>
                    
                    <div className="flex space-x-3">
                      <span className="text-slate-500">[10:42:06]</span>
                      <span className="text-yellow-400">WARN</span>
                      <span>Status change: Asset #1042 available &rarr; loaned</span>
                    </div>
                    
                    <div className="flex space-x-3 text-white border-l-2 border-green-500 pl-2 -ml-[10px] bg-slate-800 py-1">
                      <span className="text-slate-500">[10:45:11]</span>
                      <span className="text-green-400">SUCCESS</span>
                      <span>New asset added: #1045 (Dell XPS 15) by admin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="py-24 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
              <p className="mt-4 text-lg text-slate-400">A seamless workflow for both employees and management.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="w-16 h-16 mx-auto bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold mb-6">1</div>
                <h4 className="text-xl font-semibold mb-3">Request</h4>
                <p className="text-slate-400">Employees browse the available inventory and submit a request for the equipment they need.</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold mb-6">2</div>
                <h4 className="text-xl font-semibold mb-3">Approve</h4>
                <p className="text-slate-400">IT managers review requests, assign specific assets, and approve the loan with designated return dates.</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold mb-6">3</div>
                <h4 className="text-xl font-semibold mb-3">Track</h4>
                <p className="text-slate-400">The system automatically tracks the loan status and notifies users when returns or maintenance are due.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500">© 2026 Defend Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
