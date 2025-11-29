'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Info, BookOpen, ExternalLink } from 'lucide-react'

interface DNSCheckResult {
  spf: {
    exists: boolean
    record?: string
    valid: boolean
    issues?: string[]
  }
  dkim: {
    configured: boolean
    selector?: string
    valid: boolean
    issues?: string[]
  }
  dmarc: {
    exists: boolean
    record?: string
    policy?: string
    valid: boolean
    issues?: string[]
  }
  mx: {
    exists: boolean
    records?: string[]
    valid: boolean
  }
  insights: string[]
}

export function DomainDeliverabilityCheck() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DNSCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const calculateScore = (result: DNSCheckResult): number => {
    let score = 0
    if (result.spf.exists) score += 25
    if (result.spf.valid) score += 10
    if (result.dkim.configured) score += 25
    if (result.dkim.valid) score += 10
    if (result.dmarc.exists) score += 20
    if (result.dmarc.valid) score += 5
    if (result.mx.exists && result.mx.valid) score += 5
    return score
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-destructive'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
  }

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/deliverability/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      })

      if (!response.ok) {
        throw new Error('Failed to check domain')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-4">
        <Input
          type="text"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={loading} className="sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Domain'
          )}
        </Button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="border border-destructive bg-destructive/10 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Error</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Domain Check Results</h2>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(calculateScore(result))}`}>
                  {calculateScore(result)}/100
                </div>
                <div className="text-sm text-muted-foreground">
                  {getScoreLabel(calculateScore(result))}
                </div>
              </div>
            </div>

            {calculateScore(result) < 90 && (
              <div className="mb-6 border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-950/20 p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Need help improving your score?
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      Check out our comprehensive guide for detailed instructions on configuring email authentication.
                    </p>
                    <Link
                      href="/docs/deliverability"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Read the Documentation
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* SPF Check */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                {result.spf.valid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                <h3 className="text-lg font-semibold">SPF Record</h3>
              </div>
              {result.spf.exists ? (
                <div className="ml-9 space-y-2">
                  <code className="block text-sm bg-muted p-3 rounded overflow-x-auto">
                    {result.spf.record}
                  </code>
                  {result.spf.issues && result.spf.issues.length > 0 && (
                    <div className="space-y-1">
                      {result.spf.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">{issue}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-9 space-y-3">
                  <p className="text-sm text-muted-foreground">No SPF record found</p>
                  <div className="border border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded">
                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      How to Fix: Add an SPF Record
                    </h4>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                      Add a TXT record to your domain&apos;s DNS configuration:
                    </p>
                    <code className="block text-xs bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded mb-2">
                      v=spf1 include:_spf.yourprovider.com ~all
                    </code>
                    <Link
                      href="/docs/deliverability#spf-sender-policy-framework"
                      className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:underline"
                    >
                      Learn more about SPF
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* DKIM Check */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                {result.dkim.valid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : result.dkim.configured ? (
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                <h3 className="text-lg font-semibold">DKIM Record</h3>
              </div>
              {result.dkim.configured ? (
                <div className="ml-9 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    DKIM selector detected: {result.dkim.selector || 'default'}
                  </p>
                  {result.dkim.issues && result.dkim.issues.length > 0 && (
                    <div className="space-y-1">
                      {result.dkim.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">{issue}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-9 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No DKIM record found. Configure DKIM with your email service provider.
                  </p>
                  <div className="border border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded">
                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      How to Fix: Configure DKIM
                    </h4>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                      DKIM must be configured through your email service provider:
                    </p>
                    <ol className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal ml-4 mb-2">
                      <li>Generate DKIM keys in your email provider</li>
                      <li>Add the public key TXT record to your DNS</li>
                      <li>Enable DKIM signing for outgoing emails</li>
                    </ol>
                    <Link
                      href="/docs/deliverability#dkim-domainkeys-identified-mail"
                      className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:underline"
                    >
                      Learn more about DKIM
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* DMARC Check */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                {result.dmarc.valid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                <h3 className="text-lg font-semibold">DMARC Record</h3>
              </div>
              {result.dmarc.exists ? (
                <div className="ml-9 space-y-2">
                  <code className="block text-sm bg-muted p-3 rounded overflow-x-auto">
                    {result.dmarc.record}
                  </code>
                  {result.dmarc.policy && (
                    <p className="text-sm text-muted-foreground">
                      Policy: <span className="font-medium">{result.dmarc.policy}</span>
                    </p>
                  )}
                  {result.dmarc.issues && result.dmarc.issues.length > 0 && (
                    <div className="space-y-1">
                      {result.dmarc.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">{issue}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-9 space-y-3">
                  <p className="text-sm text-muted-foreground">No DMARC record found</p>
                  <div className="border border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded">
                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      How to Fix: Add a DMARC Record
                    </h4>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                      Add a TXT record to _dmarc.yourdomain.com:
                    </p>
                    <code className="block text-xs bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded mb-2">
                      v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
                    </code>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                      Start with p=none to monitor, then move to p=quarantine or p=reject
                    </p>
                    <Link
                      href="/docs/deliverability#dmarc-domain-based-message-authentication"
                      className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:underline"
                    >
                      Learn more about DMARC
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* MX Check */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                {result.mx.valid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                <h3 className="text-lg font-semibold">MX Records</h3>
              </div>
              {result.mx.exists && result.mx.records ? (
                <div className="ml-9 space-y-1">
                  {result.mx.records.map((record, i) => (
                    <code key={i} className="block text-sm bg-muted p-2 rounded">
                      {record}
                    </code>
                  ))}
                </div>
              ) : (
                <p className="ml-9 text-sm text-muted-foreground">No MX records found</p>
              )}
            </div>
          </div>

          {/* Insights */}
          {result.insights && result.insights.length > 0 && (
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
              <div className="space-y-3">
                {result.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {calculateScore(result) < 100 && (
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Read the Documentation</h4>
                  <p className="text-sm text-muted-foreground">
                    Our comprehensive guide covers everything you need to know about email authentication.
                  </p>
                  <Link
                    href="/docs/deliverability"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View Full Documentation
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">2. Make DNS Changes</h4>
                  <p className="text-sm text-muted-foreground">
                    Apply the recommended fixes by updating your DNS records. Changes typically propagate within 24-48 hours.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">3. Re-test Your Domain</h4>
                  <p className="text-sm text-muted-foreground">
                    After making changes, come back and run the check again to verify your configuration.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">4. Monitor Your Deliverability</h4>
                  <p className="text-sm text-muted-foreground">
                    Use tools like Google Postmaster Tools and Microsoft SNDS to monitor your sender reputation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {calculateScore(result) === 100 && (
            <div className="border border-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Perfect Score! 🎉
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                    Your domain has excellent email authentication configuration. Your emails should have optimal deliverability.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                      Maintain Your Reputation:
                    </h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc ml-4">
                      <li>Monitor your bounce and spam complaint rates</li>
                      <li>Review DMARC reports regularly</li>
                      <li>Maintain consistent sending patterns</li>
                      <li>Keep your email lists clean and engaged</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}