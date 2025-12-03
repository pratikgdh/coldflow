import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

if (!SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set. Email functionality will be disabled.')
} else {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

export interface SendInvitationEmailParams {
  to: string
  subAgencyName: string
  invitationLink: string
  inviterName?: string
  role: string
}

/**
 * Send an invitation email to a new user being invited to a subagency
 */
export async function sendInvitationEmail({
  to,
  subAgencyName,
  invitationLink,
  inviterName,
  role,
}: SendInvitationEmailParams): Promise<void> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not configured')
  }

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@coldflow.com',
    subject: `You've been invited to join ${subAgencyName}`,
    text: `
You've been invited to join ${subAgencyName}!

${inviterName ? `${inviterName} has invited you to join their team` : 'You have been invited to join the team'} as a ${role}.

Click the link below to accept your invitation and create your account:
${invitationLink}

This invitation will expire in 7 days.

If you have any questions, please contact your team administrator.

Best regards,
The Coldflow Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${subAgencyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">You're Invited!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #3f3f46;">
                ${inviterName ? `<strong>${inviterName}</strong> has invited you to join` : 'You have been invited to join'} <strong>${subAgencyName}</strong> as a <strong>${role}</strong>.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #3f3f46;">
                Click the button below to accept your invitation and create your account:
              </p>

              <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <td style="border-radius: 6px; background-color: #18181b;">
                    <a href="${invitationLink}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 14px; line-height: 20px; color: #3b82f6; word-break: break-all;">
                ${invitationLink}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e4e4e7; background-color: #fafafa;">
              <p style="margin: 0 0 8px; font-size: 14px; line-height: 20px; color: #71717a;">
                <strong>Note:</strong> This invitation will expire in 7 days.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #71717a;">
                If you have any questions, please contact your team administrator.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px; text-align: center; background-color: #18181b; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 14px; color: #a1a1aa;">
                Powered by <strong style="color: #ffffff;">Coldflow</strong>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 20px 0 0; font-size: 12px; line-height: 16px; color: #71717a; text-align: center;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }

  try {
    const response = await sgMail.send(msg)
    console.log('SendGrid response:', response)
    console.log(`Invitation email sent successfully to ${to}`)
  } catch (error: any) {
    console.error('Error sending invitation email:', error)

    // Log more detailed error information
    if (error.response) {
      console.error('SendGrid error response:', error.response.body)
    }

    throw new Error(`Failed to send invitation email: ${error.message}`)
  }
}

/**
 * Check if email service is configured and ready to use
 */
export function isEmailServiceConfigured(): boolean {
  return !!SENDGRID_API_KEY
}
