import { Metadata } from 'next'
import { DomainDeliverabilityCheck } from '@/components/DomainDeliverabilityCheck'

export const metadata: Metadata = {
  title: 'Domain Deliverability Check - Coldflow',
  description:
    'Check your domain\'s email deliverability. Test SPF, DKIM, and DMARC records to ensure your emails reach the inbox.',
}

export default function DeliverabilityPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl mb-6">
            Domain Deliverability Check
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl">
            Test your domain&apos;s email infrastructure. We&apos;ll check your SPF, DKIM, and DMARC
            records and provide recommendations to improve your email deliverability.
          </p>

          {/* Domain Check Tool */}
          <DomainDeliverabilityCheck />
          </div>
        </div>
      </section>

      {/* Information Section */}
      <section className="w-full bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight mb-8">
              Why Email Authentication Matters
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">SPF (Sender Policy Framework)</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  SPF records tell receiving mail servers which IP addresses are authorized to send
                  email on behalf of your domain. Without proper SPF configuration, your emails may
                  be marked as spam or rejected entirely.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">DKIM (DomainKeys Identified Mail)</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  DKIM adds a digital signature to your emails, proving they haven&apos;t been
                  tampered with in transit. This cryptographic authentication helps email providers
                  verify your messages are legitimate.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">DMARC (Domain-based Message Authentication)</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  DMARC builds on SPF and DKIM to tell receiving servers what to do with emails that
                  fail authentication checks. It also provides reporting so you can monitor your
                  email security and deliverability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight mb-8">
            Email Deliverability Best Practices
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold">Warm Up Your Domain</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start with low sending volumes and gradually increase over 2-4 weeks to build sender
                reputation.
              </p>
            </div>
            <div className="space-y-3 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold">Monitor Your Metrics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track open rates, bounce rates, and spam complaints. High bounce rates can damage
                your sender reputation.
              </p>
            </div>
            <div className="space-y-3 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold">Maintain List Hygiene</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remove invalid and unengaged contacts regularly. Clean lists lead to better
                deliverability.
              </p>
            </div>
            <div className="space-y-3 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold">Use Dedicated IPs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                For high-volume sending, dedicated IP addresses give you full control over your
                sender reputation.
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>
    </div>
  )
}