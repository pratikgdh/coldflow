# API Keys Feature - Deployment Checklist

## Pre-Deployment

### 1. Database Migrations

- [x] Migration file generated: `libs/db/drizzle/0003_powerful_toad_men.sql`
- [ ] Review migration SQL for correctness
  ```bash
  cat libs/db/drizzle/0003_powerful_toad_men.sql
  ```
- [ ] Backup production database before applying migration
  ```bash
  # Your backup command here
  pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Apply migration to staging environment first
  ```bash
  pnpm db:migrate
  ```
- [ ] Verify migration applied successfully
  ```bash
  # Check that api_key table exists with correct schema
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d api_key"
  ```

### 2. Environment Variables

- [x] No new environment variables required
- [ ] Verify existing variables are set:
  - `DATABASE_URL` - PostgreSQL connection string
  - `BETTER_AUTH_SECRET` - Auth secret key
  - `BETTER_AUTH_URL` - Base URL for authentication

### 3. Dependencies

- [x] `bcryptjs` installed
- [x] `@types/bcryptjs` installed
- [ ] Verify all dependencies installed
  ```bash
  pnpm install
  ```

### 4. Code Review

- [x] Database schema and migrations reviewed
- [x] API endpoints implement proper authentication
- [x] Rate limiting configured (5 keys/hour)
- [x] API keys never stored in plain text (bcrypt hashing)
- [x] Audit logging implemented
- [x] Frontend component follows existing patterns
- [ ] Security review completed (see security checklist below)

### 5. Build Verification

- [ ] Frontend builds without errors
  ```bash
  pnpm build
  ```
- [ ] TypeScript compilation succeeds
  ```bash
  pnpm typecheck
  ```
- [ ] Linting passes
  ```bash
  pnpm lint
  ```

## Deployment Steps

### 1. Staging Deployment

- [ ] Deploy code to staging environment
- [ ] Apply database migration
  ```bash
  pnpm db:migrate
  ```
- [ ] Restart application server
- [ ] Verify API key table exists
  ```bash
  psql -h $STAGING_DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM api_key LIMIT 1;"
  ```

### 2. Smoke Testing on Staging

- [ ] Log in to staging dashboard
- [ ] Navigate to Settings > API Keys
- [ ] Create a new API key
- [ ] Verify key is displayed only once
- [ ] Copy the API key
- [ ] Make an API request with the key
  ```bash
  curl -H "Authorization: Bearer cfk_..." https://staging.example.com/api/sub-agencies
  ```
- [ ] Verify request succeeds with 200 status
- [ ] Delete the test API key
- [ ] Verify key is immediately invalidated
- [ ] Attempt API request with deleted key (should return 401)

### 3. Production Deployment

- [ ] Create production database backup
- [ ] Deploy code to production
- [ ] Apply database migration
  ```bash
  NODE_ENV=production pnpm db:migrate
  ```
- [ ] Restart production servers
- [ ] Monitor error logs during startup
  ```bash
  # Your log monitoring command
  tail -f /var/log/app/error.log
  ```

## Post-Deployment Verification

### 1. Functional Testing

- [ ] User can navigate to Settings > API Keys
- [ ] User can create an API key
  - [ ] With custom name
  - [ ] With sub-agency scope
  - [ ] With expiration date
  - [ ] Without expiration
- [ ] Plain key is shown exactly once
- [ ] Copy to clipboard works
- [ ] API key list displays correctly
  - [ ] Shows key prefix (first 8 chars)
  - [ ] Shows sub-agency name if scoped
  - [ ] Shows last used timestamp
  - [ ] Shows created date
  - [ ] Shows expiration date if set
- [ ] User can delete an API key
- [ ] Deleted key is removed from list immediately

### 2. API Authentication Testing

- [ ] Create test API key via UI
- [ ] Test successful authentication
  ```bash
  curl -H "Authorization: Bearer cfk_..." https://api.example.com/api/sub-agencies
  ```
- [ ] Test invalid key (should return 401)
  ```bash
  curl -H "Authorization: Bearer cfk_invalid123" https://api.example.com/api/sub-agencies
  ```
- [ ] Test missing Authorization header (should return 401)
  ```bash
  curl https://api.example.com/api/sub-agencies
  ```
- [ ] Test malformed header (should return 401)
  ```bash
  curl -H "Authorization: cfk_..." https://api.example.com/api/sub-agencies
  ```

### 3. Scoped Key Testing

- [ ] Create key scoped to specific sub-agency
- [ ] Verify key works for scoped sub-agency
  ```bash
  curl -H "Authorization: Bearer cfk_..." https://api.example.com/api/sub-agencies
  ```
- [ ] Verify key rejects access to other sub-agencies (should return 403)

### 4. Expiration Testing

- [ ] Create key with 30-day expiration
- [ ] Verify expiresAt date is set correctly (30 days from now)
- [ ] (Optional) Create key with very short expiration for testing
- [ ] (Optional) Wait for expiration and verify 401 response

### 5. Rate Limiting Testing

- [ ] Attempt to create 6 API keys rapidly
- [ ] Verify 6th request returns 429 Too Many Requests
- [ ] Verify Retry-After header is present
- [ ] Wait 1 hour or reset rate limit manually for testing
- [ ] Verify can create keys again

### 6. Audit Logging Verification

- [ ] Monitor logs during API key operations
  ```bash
  # Look for [API_KEY_AUDIT] logs
  grep "API_KEY_AUDIT" /var/log/app/*.log
  ```
- [ ] Verify logs contain:
  - [ ] API_KEY_CREATED events
  - [ ] API_KEY_DELETED events
  - [ ] API_KEY_USED events
  - [ ] API_KEY_AUTH_FAILED events
- [ ] Verify logs include:
  - [ ] userId
  - [ ] keyId
  - [ ] timestamp
  - [ ] IP address
  - [ ] User agent

### 7. Performance Testing

- [ ] Verify API key authentication doesn't add significant latency
  ```bash
  # Measure response time with API key auth
  time curl -H "Authorization: Bearer cfk_..." https://api.example.com/api/sub-agencies
  ```
- [ ] Check database query performance with EXPLAIN ANALYZE
  ```sql
  EXPLAIN ANALYZE SELECT * FROM api_key WHERE hashed_key = 'hash';
  ```
- [ ] Verify indexes are being used (should see "Index Scan" not "Seq Scan")

## Monitoring and Alerts

### Metrics to Monitor

- [ ] API key creation rate
- [ ] API key authentication failures (401 errors)
- [ ] Rate limit hits (429 errors)
- [ ] API key usage patterns
- [ ] Database query performance for API key lookups

### Set Up Alerts

- [ ] Alert on high rate of authentication failures (potential attack)
- [ ] Alert on excessive rate limit hits (user confusion or abuse)
- [ ] Alert on database slow queries (> 100ms for API key lookups)
- [ ] Alert on error rate spikes in API key endpoints

### Log Monitoring

- [ ] Ensure API_KEY_AUDIT logs are being captured
- [ ] Set up log aggregation (e.g., CloudWatch, DataDog, Splunk)
- [ ] Create dashboard for API key metrics
- [ ] Set up alerts for suspicious patterns:
  - Multiple failed auth attempts from same IP
  - API keys being used from many different IPs
  - Sudden spike in API key creation

## Rollback Plan

If issues are discovered after deployment:

### 1. Immediate Rollback (Code Only)

- [ ] Revert to previous code version
- [ ] Restart application servers
- [ ] Verify application functions normally
- [ ] Note: Database migration is NOT rolled back (keys table remains but unused)

### 2. Full Rollback (Code + Database)

Only if database migration causes issues:

- [ ] Revert code to previous version
- [ ] Run rollback migration:
  ```sql
  -- Rollback SQL
  DROP INDEX IF EXISTS api_key_userId_subAgencyId_idx;
  DROP INDEX IF EXISTS api_key_subAgencyId_idx;
  DROP INDEX IF EXISTS api_key_hashedKey_idx;
  DROP INDEX IF EXISTS api_key_userId_idx;
  ALTER TABLE api_key DROP CONSTRAINT IF EXISTS api_key_sub_agency_id_sub_agency_id_fk;
  ALTER TABLE api_key DROP CONSTRAINT IF EXISTS api_key_user_id_user_id_fk;
  DROP TABLE IF EXISTS api_key;
  ```
- [ ] Restart application
- [ ] Verify application functions normally

### 3. Partial Rollback (Disable Feature)

If you want to keep code but disable the feature:

- [ ] Remove "API Keys" tab from Settings page UI
- [ ] Keep API endpoints (harmless if not used)
- [ ] Keep database table (can be used later)

## Post-Deployment Tasks

### Week 1

- [ ] Monitor error logs daily
- [ ] Check audit logs for API key usage
- [ ] Review rate limiting effectiveness
- [ ] Collect user feedback

### Week 2-4

- [ ] Analyze API key usage patterns
- [ ] Review audit logs for security issues
- [ ] Optimize database queries if needed
- [ ] Consider implementing usage analytics

### Month 1+

- [ ] Review rate limiting thresholds
- [ ] Consider implementing cron job for expired key cleanup
- [ ] Gather feedback for future enhancements:
  - Database audit table (instead of console logs)
  - Usage analytics dashboard
  - IP allowlisting
  - Granular permissions per key

## Security Checklist

### Data Protection

- [x] API keys hashed with bcrypt before storage
- [x] Plain keys never stored in database
- [x] Plain keys only shown once at creation
- [x] API keys use cryptographically secure random generation
- [ ] Verify no API keys in application logs
- [ ] Verify no API keys in error messages
- [ ] Verify SSL/TLS enabled for all API traffic

### Access Control

- [x] API key creation requires authentication
- [x] Users can only delete their own keys
- [x] Sub-agency scoping enforced for scoped keys
- [x] Rate limiting prevents abuse (5 keys/hour)
- [ ] Verify role-based access control works correctly

### Audit and Compliance

- [x] All API key operations logged
- [x] Logs include user ID, timestamp, IP, user agent
- [x] Failed authentication attempts logged
- [ ] Ensure logs are stored securely
- [ ] Ensure logs meet compliance requirements (GDPR, SOC2, etc.)

### Vulnerability Prevention

- [x] SQL injection: Protected by ORM parameterized queries
- [x] Timing attacks: bcrypt.compare is timing-safe
- [x] Brute force: Rate limiting implemented
- [ ] CSRF: Verify Next.js CSRF protection active
- [ ] XSS: Verify React escapes all user input
- [ ] Review error messages don't leak sensitive info

## Success Criteria

The deployment is considered successful when:

- [ ] Users can create, view, and delete API keys
- [ ] API keys successfully authenticate API requests
- [ ] Scoped keys enforce sub-agency restrictions
- [ ] Rate limiting prevents abuse
- [ ] Audit logs capture all operations
- [ ] No critical errors in production logs
- [ ] Performance meets SLAs (API key auth < 100ms)
- [ ] No security vulnerabilities identified
- [ ] User feedback is positive
- [ ] Documentation is complete and accurate

## Support Preparation

- [ ] Support team briefed on new feature
- [ ] Documentation shared with support
- [ ] Known issues documented
- [ ] Escalation path defined for API key issues
- [ ] FAQ prepared for common questions:
  - How to create an API key?
  - How to use an API key?
  - What to do if key is lost?
  - How to rotate keys?
  - What are rate limits?

## Contact Information

- **Technical Lead:** [Name]
- **DevOps:** [Name]
- **Security:** [Name]
- **On-Call:** [Rotation schedule]

## Notes

- API keys are a security-critical feature - deploy during business hours when team is available
- Plan for ~1 hour deployment window including testing
- Have database admin available for migration support
- Communicate deployment to users in advance if possible
