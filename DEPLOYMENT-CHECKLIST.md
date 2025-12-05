# Deployment Checklist

Use this checklist to ensure a successful deployment of the Quote and Bid Management Tool.

---

## Pre-Deployment Checklist

### Infrastructure
- [ ] Docker installed (version 20.10+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] Server has minimum 4GB RAM, 2 CPU cores
- [ ] At least 20GB free disk space
- [ ] Network access to Supabase cloud
- [ ] Root/sudo access to server

### Supabase Setup
- [ ] Supabase account created
- [ ] New project created and initialized
- [ ] Project URL copied
- [ ] Anon key copied
- [ ] Service role key copied (for edge functions)
- [ ] Email auth enabled
- [ ] Email confirmation disabled

### Application Files
- [ ] Application code downloaded/cloned
- [ ] All source files present in `/opt/quote-app`
- [ ] `.env.production` file created
- [ ] Environment variables configured
- [ ] Scripts are executable (`chmod +x scripts/*.sh`)

---

## Deployment Checklist

### 1. Environment Configuration
- [ ] `.env.production` file exists
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] `NODE_ENV=production` is set
- [ ] No spaces or quotes around values
- [ ] File has proper permissions (readable by Docker)

### 2. SSL/TLS Setup
- [ ] SSL directory created: `/opt/quote-app/ssl`
- [ ] Certificate file exists: `ssl/cert.pem`
- [ ] Key file exists: `ssl/key.pem`
- [ ] Certificate permissions set (600 for key, 644 for cert)
- [ ] Certificate is valid (check expiry date)

### 3. Database Migration
- [ ] All migration files available in `supabase/migrations/`
- [ ] Migrations applied in chronological order
- [ ] No migration errors in Supabase logs
- [ ] Tables created successfully
- [ ] RLS policies applied
- [ ] Functions created (check `optimize_pending_approvals_query`)
- [ ] Database schema verified in Supabase Dashboard

**Verify with SQL:**
```sql
-- Check tables exist
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return 20+ tables

-- Check RLS is enabled
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- Should return most tables
```

### 4. Docker Build
- [ ] Dockerfile exists in project root
- [ ] docker-compose.yml exists
- [ ] nginx.conf exists
- [ ] nginx-proxy.conf exists
- [ ] .dockerignore exists
- [ ] `docker-compose build` completes successfully
- [ ] No build errors in output

### 5. Application Deployment
- [ ] Deployment script executed: `./scripts/deploy.sh`
- [ ] Build completed without errors
- [ ] Containers started successfully
- [ ] Health checks passing
- [ ] No error logs in container output

**Verify:**
```bash
docker ps | grep quote-app  # Should show 2 containers running
curl http://localhost:8080/health  # Should return "healthy"
```

### 6. Edge Functions Deployment
- [ ] Supabase CLI installed
- [ ] Logged in to Supabase CLI
- [ ] Project linked to CLI
- [ ] `import-products` function deployed
- [ ] `import-customers` function deployed
- [ ] `import-cross-references` function deployed
- [ ] Functions verified in Supabase Dashboard
- [ ] Function secrets configured (if needed)

**Verify:**
```bash
supabase functions list  # Should show 3 functions
```

---

## Post-Deployment Checklist

### 7. Initial Configuration

#### Admin User Setup
- [ ] Application accessible in browser
- [ ] Sign-up form works
- [ ] First user account created
- [ ] User ID retrieved from database
- [ ] Admin role assigned via SQL
- [ ] Can log in as admin
- [ ] Admin dashboard accessible

**SQL to run:**
```sql
INSERT INTO user_roles (user_id, email, role, is_active)
VALUES ('USER_ID', 'admin@company.com', 'Admin', true);
```

#### Import API Configuration
- [ ] Import API auth config added to database
- [ ] Username and password set
- [ ] API endpoints tested with credentials
- [ ] Rate limiting verified

**SQL to run:**
```sql
INSERT INTO app_configurations (config_key, config_value, description)
VALUES
  ('import_api_enabled', 'true', 'Enable import API'),
  ('import_api_username', 'api_user', 'Username'),
  ('import_api_password', 'SecurePassword123!', 'Password');
```

#### Approval Limits
- [ ] Role approval limits configured
- [ ] Limits tested with sample quotes
- [ ] Approval workflow verified

**SQL to run:**
```sql
INSERT INTO role_approval_limits (role, min_amount, max_amount)
VALUES
  ('CSR', 0, 25000),
  ('Manager', 25000, 50000),
  ('Director', 50000, 200000),
  ('VP', 200000, 300000),
  ('President', 300000, 999999999);
```

### 8. Application Testing

#### Basic Functionality
- [ ] User can log in
- [ ] User can log out
- [ ] Dashboard loads correctly
- [ ] No console errors in browser
- [ ] All menu items accessible
- [ ] Dark mode toggle works

#### Quote Management
- [ ] Can create new quote
- [ ] Can add line items
- [ ] Can save quote
- [ ] Can edit existing quote
- [ ] Can delete quote
- [ ] Quote calculations are correct
- [ ] Quote status changes work

#### Customer Management
- [ ] Can view customers
- [ ] Can add customer
- [ ] Can edit customer
- [ ] Customer contacts work
- [ ] Customer addresses work

#### Product Management
- [ ] Can view products
- [ ] Can search products
- [ ] Product details display correctly

#### Approval System
- [ ] Quote submission works
- [ ] Pending approvals visible to approvers
- [ ] Approval/rejection works
- [ ] Email notifications (if configured)
- [ ] Approval history visible

#### Import APIs
- [ ] Product import API works
- [ ] Customer import API works
- [ ] Cross-reference import API works
- [ ] Authentication required
- [ ] Rate limiting active

### 9. Security Verification

#### Authentication & Authorization
- [ ] Can't access app without login
- [ ] Session timeout works
- [ ] Logout works properly
- [ ] Role-based access works
- [ ] Admin sees all features
- [ ] Regular users see limited features

#### RLS Policies
- [ ] Users can only see their quotes
- [ ] Managers can see team quotes
- [ ] Admins can see all data
- [ ] No unauthorized data access

#### API Security
- [ ] Import APIs require authentication
- [ ] Rate limiting prevents abuse
- [ ] HTTPS enforced (if SSL configured)
- [ ] Security headers present in responses

**Test:**
```bash
# Should fail without auth
curl http://localhost:8080/functions/v1/import-products

# Should succeed with auth
curl -u api_user:password http://localhost:8080/functions/v1/import-products
```

### 10. Performance Testing

#### Response Times
- [ ] Page load < 2 seconds
- [ ] Quote list loads quickly
- [ ] Search responds instantly
- [ ] No lag in UI interactions

#### Database Performance
- [ ] Queries execute in <100ms
- [ ] No slow query warnings
- [ ] Pending approvals query optimized
- [ ] Database indexes in place

#### Resource Usage
- [ ] Container memory < 1GB
- [ ] Container CPU < 50% avg
- [ ] Disk I/O reasonable
- [ ] No memory leaks after 24 hours

**Monitor:**
```bash
docker stats quote-app
```

### 11. Monitoring & Logging

#### Log Collection
- [ ] Application logs accessible
- [ ] Docker logs working
- [ ] Nginx access logs available
- [ ] Nginx error logs available
- [ ] Log rotation configured

**Commands:**
```bash
docker-compose logs -f quote-app
docker-compose logs -f nginx-proxy
```

#### Health Monitoring
- [ ] Monitoring script installed
- [ ] Health check endpoint working
- [ ] Cron job configured
- [ ] Alerts configured (email/Slack)
- [ ] Auto-restart on failure works

**Setup:**
```bash
sudo crontab -e
# Add: */5 * * * * /opt/quote-app/scripts/monitor.sh
```

#### Backup System
- [ ] Backup directory created
- [ ] Manual backup tested
- [ ] Supabase automatic backups verified
- [ ] Backup retention policy set
- [ ] Restore procedure tested

**Test backup:**
```bash
docker-compose down
# Restore from backup
docker-compose up -d
```

---

## Production Readiness Checklist

### Documentation
- [ ] Deployment guide reviewed
- [ ] Operations team trained
- [ ] Troubleshooting guide available
- [ ] User documentation created
- [ ] API documentation available

### Disaster Recovery
- [ ] Backup strategy defined
- [ ] Restore procedure documented
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] DR plan tested

### Support
- [ ] Support contact information distributed
- [ ] On-call rotation established (if applicable)
- [ ] Escalation procedures defined
- [ ] Incident response plan created

### Compliance & Security
- [ ] Security audit completed
- [ ] Compliance requirements met
- [ ] Data retention policy applied
- [ ] Privacy policy implemented
- [ ] Terms of service available

---

## Go-Live Checklist

### Final Checks (24 hours before)
- [ ] All above checklists completed
- [ ] Full system test completed
- [ ] Load testing performed (if applicable)
- [ ] Rollback plan prepared
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled

### Go-Live Day
- [ ] Final backup taken
- [ ] All services healthy
- [ ] DNS updated (if applicable)
- [ ] Firewall rules applied
- [ ] Users notified of go-live
- [ ] Support team on standby

### Post Go-Live (24 hours after)
- [ ] Monitor logs for errors
- [ ] Check user feedback
- [ ] Verify all critical functions work
- [ ] No performance degradation
- [ ] No security incidents
- [ ] Support tickets resolved

---

## Sign-Off

### Deployment Team

**Deployed by:** ___________________ **Date:** _______________

**Verified by:** ___________________ **Date:** _______________

**Approved by:** ___________________ **Date:** _______________

### Issues Encountered

List any issues found during deployment:

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Notes

Additional notes or observations:

_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

---

## Quick Reference

### Important URLs
- Application: http://localhost:8080 or https://localhost
- Supabase Dashboard: https://app.supabase.com
- Health Check: http://localhost:8080/health

### Important Files
- Environment: `/opt/quote-app/.env.production`
- Docker Compose: `/opt/quote-app/docker-compose.yml`
- SSL Certs: `/opt/quote-app/ssl/`
- Logs: `/opt/quote-app/logs/`

### Important Commands
```bash
# Start/Stop
docker-compose up -d
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Health Check
curl http://localhost:8080/health

# Monitor
docker stats quote-app
```

---

**Checklist Version:** 1.0
**Last Updated:** 2025-11-16
