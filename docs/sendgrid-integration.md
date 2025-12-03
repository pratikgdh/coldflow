# SendGrid Email Integration

This document describes the SendGrid email integration for sending subagency user invitation emails.

## Overview

When a user is invited to join a subagency, the system sends an automated email containing:
- A welcome message
- The name of the subagency they're being invited to
- The role they'll have (admin, member, or viewer)
- A secure invitation link that expires in 7 days
- Information about who invited them

## Setup

### 1. Install Dependencies

The `@sendgrid/mail` package has been installed in the frontend application:

```bash
cd apps/frontend
pnpm add @sendgrid/mail
```

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# SendGrid API key for sending emails
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Email address to use as the sender (must be verified in SendGrid)
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Getting a SendGrid API Key:**
1. Sign up for a SendGrid account at https://sendgrid.com
2. Navigate to Settings > API Keys
3. Create a new API key with "Mail Send" permissions
4. Copy the API key and add it to your `.env` file

**Verifying Sender Email:**
1. In SendGrid, go to Settings > Sender Authentication
2. Verify your domain or single sender email address
3. Use the verified email address in `SENDGRID_FROM_EMAIL`

### 3. Files Modified/Created

#### New Files:
- `/apps/frontend/src/lib/email.ts` - Email service module with SendGrid integration

#### Modified Files:
- `/apps/frontend/src/app/api/users/invite/route.ts` - Updated to send emails via SendGrid
- `/apps/frontend/.env.example` - Added SendGrid configuration variables

## Architecture

### Email Service Module (`src/lib/email.ts`)

The email service provides:

1. **SendGrid Initialization**: Configures SendGrid with the API key from environment variables
2. **Email Template**: HTML and text versions of the invitation email
3. **Error Handling**: Graceful error handling with detailed logging
4. **Service Status Check**: Function to verify if SendGrid is configured

Key functions:
- `sendInvitationEmail(params)`: Sends an invitation email
- `isEmailServiceConfigured()`: Checks if SendGrid API key is set

### Invitation Route Integration

The `/api/users/invite` endpoint has been enhanced to:

1. Create an invitation token in the database
2. Generate a secure invitation link
3. Send the invitation email via SendGrid
4. Handle email failures gracefully (invitation is still created if email fails)
5. Return detailed status including whether the email was sent

## Email Template

The invitation email includes:

**HTML Version:**
- Professional, responsive design
- Mobile-friendly layout
- Clear call-to-action button
- Branded footer
- Security notice about expiration

**Text Version:**
- Clean, readable plain text format
- All essential information included
- Fallback for email clients that don't support HTML

## Error Handling

The implementation includes robust error handling:

1. **Missing Configuration**: If `SENDGRID_API_KEY` is not set, the system logs a warning and continues without sending emails. The invitation link is still returned in the response.

2. **SendGrid API Errors**: If the email fails to send, the error is logged but the invitation is still created. The response includes an `emailError` field with details.

3. **Development Mode**: In development, the invitation link is always included in the API response for testing purposes.

4. **Production Mode**: In production, the invitation link is only included if the email failed to send.

## API Response

The `/api/users/invite` POST endpoint returns:

```json
{
  "message": "Invitation sent successfully",
  "email": "user@example.com",
  "role": "member",
  "subAgencyName": "Example Agency",
  "emailSent": true,
  "invitationLink": "http://localhost:3000/auth/accept-invite?token=abc123" // Only in dev or if email failed
}
```

If email sending fails:

```json
{
  "message": "Invitation created but email could not be sent",
  "email": "user@example.com",
  "role": "member",
  "subAgencyName": "Example Agency",
  "emailSent": false,
  "emailError": "API key is invalid",
  "invitationLink": "http://localhost:3000/auth/accept-invite?token=abc123"
}
```

## Testing

### Manual Testing

1. **With SendGrid configured:**
   ```bash
   # Set up environment variables
   export SENDGRID_API_KEY=your_api_key
   export SENDGRID_FROM_EMAIL=verified@yourdomain.com

   # Start the application
   pnpm dev

   # Make a request to invite a user
   curl -X POST http://localhost:3000/api/users/invite \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_auth_token" \
     -d '{
       "email": "newuser@example.com",
       "role": "member",
       "subAgencyId": "agency_id_here"
     }'
   ```

2. **Without SendGrid configured (testing fallback):**
   ```bash
   # Don't set SENDGRID_API_KEY
   # The system will create the invitation but won't send an email
   # The invitation link will be returned in the API response
   ```

### Monitoring

Check the server logs for email sending status:

```
# Successful email send:
Invitation email sent successfully to user@example.com

# Configuration warning:
SENDGRID_API_KEY is not set. Email functionality will be disabled.

# Email sending failure:
Failed to send invitation email: API key is invalid
```

## Security Considerations

1. **API Key Protection**: Never commit the `SENDGRID_API_KEY` to version control
2. **Sender Verification**: Always use a verified sender email address
3. **Token Security**: Invitation tokens are cryptographically secure (32 characters via nanoid)
4. **Expiration**: Invitation links expire after 7 days
5. **Rate Limiting**: Consider implementing rate limiting on the invitation endpoint to prevent abuse

## Future Enhancements

Potential improvements:

1. **Email Templates**: Move to dynamic templates in SendGrid for easier updates
2. **Email Tracking**: Add open/click tracking via SendGrid
3. **Retry Logic**: Implement automatic retry for transient failures
4. **Email Queue**: Add a queue system (Redis/BullMQ) for better reliability
5. **Multiple Email Types**: Support for other email types (password reset, notifications, etc.)
6. **Localization**: Support for multiple languages in email templates
7. **Custom Branding**: Allow subagencies to customize email branding

## Troubleshooting

### Email not received

1. Check spam/junk folders
2. Verify the sender email is authenticated in SendGrid
3. Check SendGrid activity logs for delivery status
4. Verify the recipient email address is valid

### "API key is invalid" error

1. Ensure the API key is correctly copied from SendGrid
2. Verify the API key has "Mail Send" permissions
3. Check if the API key has been revoked in SendGrid

### "From email not verified" error

1. Go to SendGrid Settings > Sender Authentication
2. Verify your domain or single sender email
3. Update `SENDGRID_FROM_EMAIL` to match the verified address

## Support

For SendGrid-specific issues:
- SendGrid Documentation: https://docs.sendgrid.com
- SendGrid Support: https://support.sendgrid.com

For application-specific issues:
- Check server logs for detailed error messages
- Review the email service code in `src/lib/email.ts`
- Test the invitation flow without SendGrid to isolate the issue
