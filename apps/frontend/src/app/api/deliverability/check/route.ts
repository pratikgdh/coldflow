import { NextRequest, NextResponse } from 'next/server'
import { promises as dns } from 'dns'

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

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json()

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
    }

    // Clean the domain input
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')

    const result: DNSCheckResult = {
      spf: { exists: false, valid: false },
      dkim: { configured: false, valid: false },
      dmarc: { exists: false, valid: false },
      mx: { exists: false, valid: false },
      insights: [],
    }

    // Check SPF Record
    try {
      const txtRecords = await dns.resolveTxt(cleanDomain)
      const spfRecord = txtRecords.find((records) =>
        records.some((record) => record.startsWith('v=spf1')),
      )

      if (spfRecord) {
        const spfString = spfRecord.join('')
        result.spf.exists = true
        result.spf.record = spfString
        result.spf.valid = true
        result.spf.issues = []

        // Check for common SPF issues
        if (!spfString.includes('~all') && !spfString.includes('-all')) {
          result.spf.issues.push('SPF record should end with ~all (soft fail) or -all (hard fail)')
          result.spf.valid = false
        }

        const includeCount = (spfString.match(/include:/g) || []).length
        if (includeCount > 10) {
          result.spf.issues.push(
            `Too many DNS lookups (${includeCount} includes). SPF has a limit of 10 DNS lookups.`,
          )
          result.spf.valid = false
        }
      } else {
        result.insights.push(
          'No SPF record found. Add an SPF record to prevent your emails from being marked as spam.',
        )
      }
    } catch (error) {
      result.insights.push('Could not retrieve SPF record. Ensure your domain has proper DNS configuration.')
    }

    // Check DMARC Record
    try {
      const dmarcDomain = `_dmarc.${cleanDomain}`
      const dmarcRecords = await dns.resolveTxt(dmarcDomain)
      const dmarcRecord = dmarcRecords.find((records) =>
        records.some((record) => record.startsWith('v=DMARC1')),
      )

      if (dmarcRecord) {
        const dmarcString = dmarcRecord.join('')
        result.dmarc.exists = true
        result.dmarc.record = dmarcString
        result.dmarc.valid = true
        result.dmarc.issues = []

        // Extract policy
        const policyMatch = dmarcString.match(/p=([^;]+)/)
        if (policyMatch) {
          result.dmarc.policy = policyMatch[1]

          if (policyMatch[1] === 'none') {
            result.dmarc.issues.push(
              'DMARC policy is set to "none". Consider using "quarantine" or "reject" for better protection.',
            )
          }
        }

        // Check for reporting addresses
        if (!dmarcString.includes('rua=') && !dmarcString.includes('ruf=')) {
          result.dmarc.issues.push(
            'No reporting addresses configured. Add rua= for aggregate reports and ruf= for forensic reports.',
          )
        }
      } else {
        result.insights.push(
          'No DMARC record found. DMARC helps protect your domain from spoofing and provides reporting on email authentication.',
        )
      }
    } catch (error) {
      result.insights.push('Could not retrieve DMARC record. Configure DMARC to improve email security.')
    }

    // Check DKIM (common selectors)
    const commonSelectors = ['default', 'google', 'k1', 'selector1', 'selector2', 'dkim', 's1', 's2']
    let dkimFound = false

    for (const selector of commonSelectors) {
      try {
        const dkimDomain = `${selector}._domainkey.${cleanDomain}`
        await dns.resolveTxt(dkimDomain)
        result.dkim.configured = true
        result.dkim.selector = selector
        result.dkim.valid = true
        dkimFound = true
        break
      } catch (error) {
        // Continue checking other selectors
      }
    }

    if (!dkimFound) {
      result.insights.push(
        'No DKIM record found with common selectors. Configure DKIM with your email service provider to add cryptographic authentication to your emails.',
      )
    }

    // Check MX Records
    try {
      const mxRecords = await dns.resolveMx(cleanDomain)
      if (mxRecords && mxRecords.length > 0) {
        result.mx.exists = true
        result.mx.valid = true
        result.mx.records = mxRecords
          .sort((a, b) => a.priority - b.priority)
          .map((record) => `${record.priority} ${record.exchange}`)
      } else {
        result.insights.push('No MX records found. Your domain cannot receive emails.')
      }
    } catch (error) {
      result.insights.push('Could not retrieve MX records. Check your DNS configuration.')
    }

    // Additional insights based on overall configuration
    const hasAllRecords = result.spf.exists && result.dmarc.exists && result.dkim.configured
    if (hasAllRecords) {
      result.insights.push(
        '✓ Great! Your domain has SPF, DKIM, and DMARC configured. Monitor your email metrics and adjust as needed.',
      )
    } else {
      const missing = []
      if (!result.spf.exists) missing.push('SPF')
      if (!result.dkim.configured) missing.push('DKIM')
      if (!result.dmarc.exists) missing.push('DMARC')

      if (missing.length > 0) {
        result.insights.push(
          `Configure ${missing.join(', ')} to improve your email deliverability and protect your domain from spoofing.`,
        )
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error checking domain:', error)
    return NextResponse.json(
      { error: 'Failed to check domain. Please try again.' },
      { status: 500 },
    )
  }
}