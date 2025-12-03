# Implementation Plan: API Keys Management System

## Objective

Implement a comprehensive API keys management system that allows users to
generate, view, manage, and delete API keys with optional sub-agency scoping.
This feature will enable programmatic access to the platform while maintaining
security through hashed storage, role-based permissions, and comprehensive audit
logging.

## Technical Analysis

### Current State

The codebase uses a modern Next.js 15 monorepo architecture with:

- **Database**: PostgreSQL with Drizzle ORM (libs/db)
- **Authentication**: better-auth library with email/password authentication
- **Authorization**: Custom middleware (libs/auth, src/lib/authorization.ts)
  with role-based access control
- **Sub-agencies**: Fully implemented with owner/admin/member/viewer roles and
  hierarchical permissions
- **API Patterns**: RESTful endpoints following `/api/[resource]/route.ts`
  pattern with:
  - Zod validation schemas
  - nanoid for ID generation
  - requireAuth() middleware for authentication
  - Role checking via isSubAgencyOwner(), isAgencyAdmin(), checkUserRole()
- **Frontend**: React with shadcn/ui components, client components with React
  hooks for state management
- **Settings UI**: Existing tabbed interface at `/dashboard/settings` with
  SubAgencyManagement, UserAssignments, and UserInvitation components

### Proposed Changes

1. **New Database Table**: `api_key` table with fields for storing hashed keys,
   metadata, scoping, and audit information
2. **Backend API Endpoints**: CRUD operations for API keys at `/api/api-keys/*`
3. **Database Queries Module**: New query functions in
   `libs/db/src/queries/apiKey.ts`
4. **Frontend Component**: New `ApiKeyManagement.tsx` component integrated into
   the settings page
5. **Type Definitions**: New TypeScript interfaces in `src/types/settings.ts`
6. **Authentication Middleware**: API key verification middleware for
   programmatic API access
7. **Security Layer**: Crypto-based key generation, bcrypt hashing, one-time key
   display

### Potential Risks/Considerations

- **Security Critical**: API keys must NEVER be stored in plain text; only
  bcrypt hashes should persist in the database
- **One-time Display**: Keys can only be shown once at generation time; cannot
  be retrieved later
- **Breaking Changes**: None - this is a new additive feature
- **Performance**: Bcrypt hashing is CPU-intensive; may need rate limiting on
  key generation endpoint
- **Database Migration**: New table creation with proper indexes for performance
- **Backward Compatibility**: Existing session-based authentication remains
  unchanged
- **Key Rotation**: Users must be able to delete old keys and create new ones
- **Audit Trail**: All key operations (creation, usage, deletion) must be logged
  with timestamps
- **Rate Limiting**: Consider implementing rate limiting for API key usage to
  prevent abuse
- **Scope Validation**: When a key is scoped to a sub-agency, all API requests
  must validate the scope
- **Revocation**: Deleted keys must immediately become invalid

## Task Breakdown

### Phase 1: Database Schema & Queries

1. [ ] **[TASK-001] Create API key database schema**
   - **Scope**: Database layer - `libs/db/src/schema.ts`
   - **Acceptance Criteria**:
     - New `apiKey` table with fields: id, name, hashedKey, prefix (first 8
       chars for display), userId, subAgencyId (nullable), lastUsedAt,
       createdAt, expiresAt (nullable)
     - Proper indexes on userId, subAgencyId, and hashedKey for query
       performance
     - Foreign key constraints with cascade delete for userId and subAgencyId
     - Relations defined for user and subAgency
     - Table schema includes timestamps for audit trail (createdAt, lastUsedAt)
   - **Dependencies**: None

2. [ ] **[TASK-002] Generate and apply database migration**
   - **Scope**: Database migrations - `libs/db/drizzle/`
   - **Acceptance Criteria**:
     - Run `pnpm db:generate` to create migration SQL file
     - Review migration SQL for correctness (table creation, indexes,
       constraints)
     - Run `pnpm db:migrate` to apply migration to local database
     - Verify table exists in PostgreSQL with correct schema
   - **Dependencies**: TASK-001

3. [ ] **[TASK-003] Implement API key query functions**
   - **Scope**: Database queries - `libs/db/src/queries/apiKey.ts`
   - **Acceptance Criteria**:
     - `getApiKeysByUserId(userId, subAgencyId?)` - list keys with optional
       sub-agency filter, returns keys without hashed values
     - `getApiKeyByHash(hashedKey)` - lookup key by hash for authentication,
       includes user and subAgency relations
     - `createApiKey(data)` - insert new key record with hashed key
     - `deleteApiKey(id, userId)` - delete key with ownership verification
     - `updateLastUsedAt(id)` - update last used timestamp (called on each API
       request)
     - All functions include proper error handling and TypeScript types
   - **Dependencies**: TASK-002

4. [ ] **[TASK-004] Export API key queries from db package**
   - **Scope**: Database exports - `libs/db/src/queries.ts` and
     `libs/db/src/index.ts`
   - **Acceptance Criteria**:
     - Add `export * from "./queries/apiKey"` to queries.ts
     - Verify queries are accessible via `@coldflow/db` import
     - TypeScript types are properly exported
   - **Dependencies**: TASK-003

### Phase 2: Backend API Endpoints

5. [ ] **[TASK-005] Create API key generation utility**
   - **Scope**: Backend utilities - `apps/frontend/src/lib/apiKeyUtils.ts`
   - **Acceptance Criteria**:
     - `generateApiKey()` function creates secure random key (e.g., "cfk_"
       prefix + 32 random bytes as hex = 64 chars)
     - `hashApiKey(key)` function uses bcrypt with cost factor of 10 to hash
       keys
     - `verifyApiKey(plainKey, hashedKey)` function uses bcrypt.compare for
       verification
     - `extractKeyPrefix(key)` extracts first 8 characters for display purposes
     - Proper error handling for crypto operations
     - Unit tests for all utility functions
   - **Dependencies**: None

6. [ ] **[TASK-006] Implement POST /api/api-keys endpoint (Create)**
   - **Scope**: Backend API - `apps/frontend/src/app/api/api-keys/route.ts`
   - **Acceptance Criteria**:
     - Zod schema validates: name (3-50 chars, required), subAgencyId (optional
       string), expiresInDays (optional number, 1-365)
     - requireAuth() verifies user authentication
     - If subAgencyId provided, verify user is owner or admin of that sub-agency
     - Generate new API key using generateApiKey()
     - Hash the key using hashApiKey()
     - Store: id (nanoid), name, hashedKey, prefix, userId, subAgencyId,
       expiresAt (calculated from expiresInDays)
     - Return 201 with plain key in response (ONLY time plain key is sent), plus
       id, name, prefix, createdAt
     - Return 400 for validation errors, 403 for authorization failures
   - **Dependencies**: TASK-004, TASK-005

7. [ ] **[TASK-007] Implement GET /api/api-keys endpoint (List)**
   - **Scope**: Backend API - `apps/frontend/src/app/api/api-keys/route.ts`
   - **Acceptance Criteria**:
     - requireAuth() verifies user authentication
     - Optional query param: subAgencyId for filtering
     - If subAgencyId provided, verify user has access to that sub-agency
     - Call getApiKeysByUserId(userId, subAgencyId?)
     - Return array of keys with: id, name, prefix, subAgencyId, subAgencyName,
       lastUsedAt, createdAt, expiresAt
     - Never include hashedKey in response
     - Return 200 with data array
   - **Dependencies**: TASK-004, TASK-005

8. [ ] **[TASK-008] Implement DELETE /api/api-keys/[id] endpoint**
   - **Scope**: Backend API - `apps/frontend/src/app/api/api-keys/[id]/route.ts`
   - **Acceptance Criteria**:
     - requireAuth() verifies user authentication
     - Extract id from route params
     - Fetch key record to verify ownership (key.userId === currentUser.id)
     - If key has subAgencyId, verify user is owner or admin of that sub-agency
     - Call deleteApiKey(id, userId)
     - Return 200 with success message
     - Return 404 if key not found, 403 if not authorized
   - **Dependencies**: TASK-004

### Phase 3: API Key Authentication Middleware

9. [ ] **[TASK-009] Create API key authentication middleware**
   - **Scope**: Backend middleware - `apps/frontend/src/lib/apiKeyAuth.ts`
   - **Acceptance Criteria**:
     - `authenticateApiKey(request)` function extracts API key from
       Authorization header (format: "Bearer cfk_...")
     - Validates key format (starts with "cfk_", correct length)
     - Hashes the provided key using hashApiKey()
     - Looks up key in database using getApiKeyByHash()
     - Verifies key is not expired (compare expiresAt with current time)
     - Updates lastUsedAt timestamp via updateLastUsedAt()
     - Returns authenticated user object with: user (id, email, name),
       subAgencyId (scope), keyId
     - Throws 401 errors for invalid/expired/missing keys
     - Function can be used as alternative to requireAuth() for API endpoints
       that support both session and API key auth
   - **Dependencies**: TASK-004, TASK-005

10. [ ] **[TASK-010] Add API key authentication to existing API endpoints**
    - **Scope**: Backend API - Modify existing endpoints in
      `apps/frontend/src/app/api/sub-agencies/route.ts`,
      `apps/frontend/src/app/api/agency-users/route.ts`
    - **Acceptance Criteria**:
      - Create `getAuthenticatedUser(request)` helper that tries session auth
        first (requireAuth), then falls back to API key auth
        (authenticateApiKey)
      - Replace requireAuth() calls with getAuthenticatedUser() in sub-agencies
        and agency-users endpoints
      - When authenticated via API key, validate requests against subAgencyId
        scope (if key has scope, only allow operations on that sub-agency)
      - Return 403 if API key scope doesn't match requested resource
      - Maintain backward compatibility with session-based authentication
      - Add tests to verify both auth methods work
    - **Dependencies**: TASK-009

### Phase 4: Frontend Components

11. [ ] **[TASK-011] Create TypeScript types for API keys**
    - **Scope**: Frontend types - `apps/frontend/src/types/settings.ts`
    - **Acceptance Criteria**:
      - Use the drizzle schema export for typescript type for api-key
      - Update `SettingsTab` type union to include 'api-keys'
    - **Dependencies**: None

12. [ ] **[TASK-012] Create ApiKeyManagement component skeleton**
    - **Scope**: Frontend components -
      `apps/frontend/src/components/Settings/ApiKeyManagement.tsx`
    - **Acceptance Criteria**:
      - Client component ('use client' directive)
      - State management: keys list, loading, error, dialogs (create, delete),
        form data
      - Basic UI structure: header with "Create API Key" button, empty state
        message, loading skeleton
      - Fetch keys on component mount via GET /api/api-keys
      - Display keys in Card components similar to SubAgencyManagement pattern
      - Show: key name, prefix (e.g., "cfk_a1b2c3d4..."), sub-agency name (if
        scoped), last used date, created date
      - No functionality yet, just UI structure
    - **Dependencies**: TASK-011

13. [ ] **[TASK-013] Implement API key creation dialog**
    - **Scope**: Frontend component -
      `apps/frontend/src/components/Settings/ApiKeyManagement.tsx`
    - **Acceptance Criteria**:
      - Dialog with form: name input (required, 3-50 chars), sub-agency select
        (optional, dropdown), expiration select (optional, preset: 30/60/90/365
        days or never)
      - Fetch user's sub-agencies for dropdown options via GET /api/sub-agencies
      - On submit: POST to /api/api-keys with form data
      - Success: Show modal with full API key (one-time display),
        copy-to-clipboard button, warning message "Save this key now, you won't
        see it again"
      - After user dismisses success modal, refresh keys list
      - Error handling: display validation errors, API errors
      - Loading states: disable form during submission
    - **Dependencies**: TASK-012

14. [ ] **[TASK-014] Implement API key deletion functionality**
    - **Scope**: Frontend component -
      `apps/frontend/src/components/Settings/ApiKeyManagement.tsx`
    - **Acceptance Criteria**:
      - Delete button on each key card
      - Confirmation dialog: "Are you sure you want to delete API key '[name]'?
        This action cannot be undone and will immediately invalidate the key."
      - On confirm: DELETE to /api/api-keys/[id]
      - Success: refresh keys list, close dialog
      - Error handling: display error message in dialog
      - Loading state: disable buttons during deletion
    - **Dependencies**: TASK-012

15. [ ] **[TASK-015] Add copy-to-clipboard functionality**
    - **Scope**: Frontend component -
      `apps/frontend/src/components/Settings/ApiKeyManagement.tsx`
    - **Acceptance Criteria**:
      - Copy button in success modal (after key creation) to copy full API key
      - Uses navigator.clipboard.writeText() API
      - Visual feedback: button text changes to "Copied!" for 2 seconds
      - Fallback for browsers without clipboard API: select text for manual copy
      - Accessibility: proper ARIA labels for screen readers
    - **Dependencies**: TASK-013

16. [ ] **[TASK-016] Integrate ApiKeyManagement into Settings page**
    - **Scope**: Frontend page -
      `apps/frontend/src/app/(frontend)/dashboard/settings/page.tsx`
    - **Acceptance Criteria**:
      - Add 'api-keys' to SettingsTab type (if not already done)
      - Add "API Keys" tab to tabs array
      - Render `<ApiKeyManagement />` when activeTab === 'api-keys'
      - Tab order: Sub-Agencies, Users, Invitations, API Keys (last)
      - Proper TypeScript typing, no errors
    - **Dependencies**: TASK-015

### Phase 5: Security Enhancements & Polish

17. [ ] **[TASK-017] Add rate limiting to API key generation**
    - **Scope**: Backend API - `apps/frontend/src/app/api/api-keys/route.ts`
    - **Acceptance Criteria**:
      - Implement simple in-memory rate limiter (or use library like
        `rate-limiter-flexible`)
      - Limit: 5 API key creations per user per hour
      - Return 429 Too Many Requests if limit exceeded
      - Include Retry-After header with seconds until limit resets
      - Rate limit tracked per userId
    - **Dependencies**: TASK-006

18. [ ] **[TASK-018] Add expiration validation and cleanup**
    - **Scope**: Backend queries - `libs/db/src/queries/apiKey.ts`
    - **Acceptance Criteria**:
      - Modify getApiKeyByHash to check expiresAt field and return null if
        expired
      - Modify getApiKeysByUserId to filter out expired keys (or mark them as
        expired in response)
      - Create `cleanupExpiredApiKeys()` function to delete keys where expiresAt
        < NOW()
      - Document cleanup function for future cron job implementation (not
        implemented in this phase)
    - **Dependencies**: TASK-003

19. [ ] **[TASK-019] Add audit logging for API key operations**
    - **Scope**: Backend utilities - `apps/frontend/src/lib/auditLog.ts` (new
      file)
    - **Acceptance Criteria**:
      - Create `logApiKeyEvent(event)` function that logs to console with
        structured format (can be extended to database later)
      - Log events: API_KEY_CREATED, API_KEY_DELETED, API_KEY_USED,
        API_KEY_AUTH_FAILED
      - Include: userId, keyId, keyName, timestamp, ipAddress, userAgent,
        subAgencyId (if applicable)
      - Call from API key endpoints: POST (created), DELETE (deleted)
      - Call from authentication middleware: on successful auth (used), on
        failed auth (auth_failed)
      - Use proper log levels: info for normal operations, warn for failed auth
    - **Dependencies**: TASK-009

20. [ ] **[TASK-020] Add loading states and error boundaries**
    - **Scope**: Frontend component -
      `apps/frontend/src/components/Settings/ApiKeyManagement.tsx`
    - **Acceptance Criteria**:
      - Loading skeleton matches SubAgencyManagement pattern (Card with animated
        pulse)
      - Error state: user-friendly message with retry button
      - Empty state: helpful message "No API keys yet" with CTA to create first
        key
      - Network error handling: timeout, connection errors show appropriate
        messages
      - Form validation errors displayed inline below inputs
      - All async operations have loading indicators (spinners, disabled
        buttons)
    - **Dependencies**: TASK-016

### Phase 6: Testing & Documentation

21. [ ] **[TASK-021] Write API endpoint tests**
    - **Scope**: Backend tests - `apps/frontend/tests/api/api-keys.test.ts` (new
      file)
    - **Acceptance Criteria**:
      - Test POST /api/api-keys: successful creation, validation errors,
        authorization checks, sub-agency scoping
      - Test GET /api/api-keys: list all keys, filter by sub-agency, empty list
      - Test DELETE /api/api-keys/[id]: successful deletion, ownership
        verification, 404 handling
      - Test API key authentication: valid key, invalid key, expired key, scope
        validation
      - Use vitest framework (already configured in project)
      - Mock database calls, test business logic
      - Aim for 80%+ code coverage on API routes
    - **Dependencies**: TASK-010, TASK-020

22. [ ] **[TASK-022] Write component tests**
    - **Scope**: Frontend tests -
      `apps/frontend/tests/components/ApiKeyManagement.test.tsx` (new file)
    - **Acceptance Criteria**:
      - Test component rendering: empty state, loading state, keys list
      - Test key creation flow: form validation, dialog open/close, success
        modal
      - Test key deletion flow: confirmation dialog, API call
      - Test copy-to-clipboard functionality
      - Test error handling: API errors, network failures
      - Use @testing-library/react (already in devDependencies)
      - Mock fetch API, test user interactions
    - **Dependencies**: TASK-020

23. [ ] **[TASK-023] Create API keys documentation**
    - **Scope**: Documentation -
      `apps/frontend/src/app/(frontend)/docs/api-keys/page.mdx` (new file)
    - **Acceptance Criteria**:
      - User guide: how to create, manage, and delete API keys
      - API key format and usage: "Authorization: Bearer cfk_..." header format
      - Security best practices: never commit keys to git, rotate regularly, use
        scoped keys
      - Code examples: curl, JavaScript fetch, Python requests
      - Sub-agency scoping explanation: what it means, how to use it
      - Expiration policies: recommended expiration times, how to renew
      - Troubleshooting: common errors (401, 403, 429) and solutions
    - **Dependencies**: TASK-020

24. [ ] **[TASK-024] Add database indexes for performance**
    - **Scope**: Database optimization - `libs/db/src/schema.ts` (verify indexes
      exist)
    - **Acceptance Criteria**:
      - Index on apiKey.userId for fast user key lookups
      - Index on apiKey.hashedKey for authentication lookups (most critical for
        performance)
      - Index on apiKey.subAgencyId for scope filtering
      - Composite index on (userId, subAgencyId) for filtered queries
      - Verify indexes were created in migration from TASK-001
      - Run EXPLAIN ANALYZE on key queries to verify index usage
    - **Dependencies**: TASK-002

### Phase 7: Final Integration & Deployment Prep

25. [ ] **[TASK-025] End-to-end testing**
    - **Scope**: Integration tests - Manual testing or Playwright E2E tests
    - **Acceptance Criteria**:
      - Test full flow: sign in → navigate to settings → create API key → copy
        key → use key to call API → delete key
      - Test sub-agency scoping: create scoped key → verify it only works for
        that sub-agency → verify rejection for other sub-agencies
      - Test expiration: create key with short expiration → wait for expiry →
        verify key no longer works
      - Test rate limiting: attempt to create 6 keys rapidly → verify 429
        response on 6th attempt
      - Test with different user roles: owner, admin, member → verify
        appropriate permissions
      - Cross-browser testing: Chrome, Firefox, Safari
      - Mobile responsive testing: settings page and dialogs work on mobile
    - **Dependencies**: TASK-024

26. [ ] **[TASK-026] Security review and hardening**
    - **Scope**: Security audit across all API key code
    - **Acceptance Criteria**:
      - Code review checklist: no plain text keys stored, bcrypt used correctly,
        authorization checks present
      - Verify API keys never appear in logs (audit logs should show keyId, not
        actual key)
      - SQL injection protection: verify Drizzle ORM queries are parameterized
        (they are by default)
      - XSS protection: verify no user input rendered without sanitization in
        React components
      - CSRF protection: verify Next.js built-in CSRF protection applies to API
        routes
      - Verify API key generation uses crypto.randomBytes (or equivalent secure
        RNG)
      - Check for timing attacks: bcrypt.compare is timing-safe by design
      - Review error messages: don't leak sensitive information (e.g., "key not
        found" vs "invalid credentials")
    - **Dependencies**: TASK-025

27. [ ] **[TASK-027] Update environment variables documentation**
    - **Scope**: Configuration - `apps/frontend/.env.example`, README updates
    - **Acceptance Criteria**:
      - No new environment variables required (uses existing DATABASE_URL,
        BETTER_AUTH_SECRET)
      - Document optional future variables: RATE_LIMIT_API_KEY_CREATION
        (default: 5), API_KEY_EXPIRY_CLEANUP_CRON
      - Update README.md with API keys feature section
      - Include setup instructions: run migrations, restart server
    - **Dependencies**: TASK-026

28. [ ] **[TASK-028] Create deployment checklist**
    - **Scope**: Documentation - `docs/deployment-checklist.md`
    - **Acceptance Criteria**:
      - Pre-deployment: run database migrations (`pnpm db:migrate`), verify .env
        has all required secrets
      - Deployment steps: build frontend (`pnpm build`), start server
        (`pnpm start`)
      - Post-deployment verification: test API key creation, test API
        authentication, monitor logs for errors
      - Rollback plan: if issues occur, revert code and run migration rollback
        (document SQL for rollback)
      - Monitoring: set up alerts for 429 rate limit responses, 401 auth
        failures
    - **Dependencies**: TASK-027

## Notes

### Security Best Practices Implemented

- **Bcrypt Hashing**: API keys are hashed using bcrypt with cost factor 10
  before storage
- **One-time Display**: Plain text keys are only shown once at creation time
- **Key Prefix**: Only first 8 characters stored as prefix for user-friendly
  display
- **HTTPS Only**: Recommend enforcing HTTPS in production to prevent key
  interception
- **Expiration Support**: Keys can optionally expire to limit exposure window
- **Scope Limiting**: Keys can be scoped to a single sub-agency for
  least-privilege access
- **Audit Logging**: All key operations logged for security monitoring and
  compliance

### API Key Format

- Prefix: `cfk_` (ColdFlow Key)
- Random portion: 64 hex characters (256 bits of entropy)
- Total length: 68 characters
- Example:
  `cfk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

### Database Schema Summary

```sql
CREATE TABLE api_key (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hashed_key TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  sub_agency_id TEXT REFERENCES sub_agency(id) ON DELETE CASCADE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_api_key_user_id ON api_key(user_id);
CREATE INDEX idx_api_key_hashed_key ON api_key(hashed_key);
CREATE INDEX idx_api_key_sub_agency_id ON api_key(sub_agency_id);
```

### Future Enhancements (Out of Scope for Initial Release)

- **Database Audit Table**: Persist audit logs to database instead of console
  logging
- **Usage Analytics**: Track API call counts per key for usage metrics dashboard
- **Cron Job**: Automated cleanup of expired keys (function exists, scheduler
  not implemented)
- **Key Permissions**: Granular permissions per key (read-only, specific
  endpoints)
- **IP Allowlisting**: Restrict keys to specific IP addresses
- **Webhooks**: Notify on suspicious API key activity
- **Multiple API Key Types**: Separate keys for different purposes (read, write,
  admin)

### Open Questions

1. Should there be a maximum number of API keys per user? (Recommendation: 20
   keys per user)
2. Default expiration policy? (Recommendation: 90 days, but allow "never
   expires" option)
3. Should API key usage be visible in UI (last used timestamp, usage count)?
   (Recommendation: Yes, show last used in table)
4. Should we support API key rotation (generate new key, deprecate old one with
   grace period)? (Recommendation: Phase 2 feature)

### Performance Considerations

- Bcrypt hashing cost factor of 10 is a balance between security and performance
  (~100ms per hash on modern CPU)
- Database indexes on hashed_key column are critical for authentication
  performance
- Consider caching frequently used API keys in Redis for high-traffic scenarios
  (future optimization)

### Related Documentation

- better-auth documentation: https://www.better-auth.com/
- Drizzle ORM: https://orm.drizzle.team/
- bcrypt best practices:
  https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- API security guide: https://owasp.org/www-project-api-security/
