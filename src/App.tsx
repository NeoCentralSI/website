import { Sparkles, Zap } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center text-center px-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          React + shadcn/ui
        </h1>
      </div>

      <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">
        Build beautiful, accessible applications with modern components
      </p>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="px-3 py-1 bg-slate-200 rounded-full text-sm font-medium text-slate-700 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          TypeScript
        </span>
        <span className="px-3 py-1 bg-slate-200 rounded-full text-sm font-medium text-slate-700">
          Tailwind CSS
        </span>
        <span className="px-3 py-1 bg-slate-200 rounded-full text-sm font-medium text-slate-700">
          Radix UI
        </span>
      </div>
    </div>
  )
}

export default App
