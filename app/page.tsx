'use client'

import { useState } from 'react'

interface AnalysisResult {
  riskLevel: string
  reason: string
  businessImpact: string
  recommendedAction: string
  suggestedReply?: string
  leadQualityScore?: number
  businessInsight: string
}

export default function Home() {
  const [message, setMessage] = useState('')
  const [senderInfo, setSenderInfo] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const analyzeMessage = async () => {
    if (!message.trim()) {
      setError('Please enter a message to analyze')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          senderInfo,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Failed to analyze message. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    const level = riskLevel.toLowerCase()
    if (level.includes('safe')) return 'text-green-600 bg-green-50 border-green-200'
    if (level.includes('suspicious')) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (level.includes('high') || level.includes('fraud')) return 'text-red-600 bg-red-50 border-red-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Business Intelligence AI Agent
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Advanced Message Analysis • Fraud Detection • Smart Response Automation
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Message Input
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Message Content *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Paste the email, chat message, or business inquiry here..."
                    className="w-full h-40 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Sender Information (Optional)
                  </label>
                  <input
                    type="text"
                    value={senderInfo}
                    onChange={(e) => setSenderInfo(e.target.value)}
                    placeholder="Email address, name, company, phone..."
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Business Context (Optional)
                  </label>
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Industry, company size, previous interactions..."
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <button
                  onClick={analyzeMessage}
                  disabled={loading || !message.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze Message'
                  )}
                </button>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Features</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Intent & purpose detection</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Fraud, phishing & scam detection</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Business impact assessment</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Professional response suggestions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Sales lead quality scoring</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Actionable business recommendations</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            {result && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                  Analysis Results
                </h2>

                <div className={`border-2 rounded-lg p-4 ${getRiskColor(result.riskLevel)}`}>
                  <div className="font-semibold text-lg mb-1">Risk Level</div>
                  <div className="text-2xl font-bold">{result.riskLevel}</div>
                </div>

                <div className="border-l-4 border-slate-300 pl-4">
                  <div className="font-semibold text-slate-900 dark:text-white mb-2">Reason</div>
                  <div className="text-slate-700 dark:text-slate-300">{result.reason}</div>
                </div>

                <div className="border-l-4 border-slate-300 pl-4">
                  <div className="font-semibold text-slate-900 dark:text-white mb-2">Business Impact</div>
                  <div className="text-slate-700 dark:text-slate-300">{result.businessImpact}</div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Recommended Action</div>
                  <div className="text-blue-800 dark:text-blue-200">{result.recommendedAction}</div>
                </div>

                {result.suggestedReply && (
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700">
                    <div className="font-semibold text-slate-900 dark:text-white mb-2">Suggested Reply</div>
                    <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{result.suggestedReply}</div>
                  </div>
                )}

                {result.leadQualityScore !== undefined && result.leadQualityScore > 0 && (
                  <div className="flex items-center space-x-4">
                    <div className="font-semibold text-slate-900 dark:text-white">Lead Quality Score:</div>
                    <div className="flex items-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.leadQualityScore}</div>
                      <div className="text-slate-500 dark:text-slate-400 ml-1">/10</div>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="font-semibold text-green-900 dark:text-green-100 mb-2">Business Insight</div>
                  <div className="text-green-800 dark:text-green-200">{result.businessInsight}</div>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center">
                <svg className="mx-auto h-24 w-24 text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  Enter a message to analyze and get instant business intelligence
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-500 dark:text-slate-400 text-sm">
          <p>Enterprise-grade message analysis powered by AI</p>
        </footer>
      </div>
    </div>
  )
}
