# Self-Hosted Deployment Checklist

This checklist ensures a complete and secure deployment of the Quote and Bid Management Tool with self-hosted Supabase.

## Pre-Deployment Checklist

### Infrastructure Requirements

- [ ] Linux server available (Ubuntu 20.04+ or similar)
- [ ] Server meets minimum requirements:
  - [ ] 4GB RAM (8GB recommended)
  - [ ] 2 CPU cores (4 cores recommended)
  - [ ] 20GB free disk space (50GB recommended)
- [ ] Server has static IP address
- [ ] DNS records configured (if using domain name)
- [ ] Network access configured:
  - [ ] SSH access (port 22)
  - [ ] HTTP access (port 80)
  - [ ] HTTPS access (port 443)

### Software Prerequisites

- [ ] Docker 20.10+ installed
- [ ] Docker Compose 1.29+ installed
- [ ] OpenSSL installed
- [ ] Git installed (if cloning from repository)
- [ ] Sufficient permissions (root or sudo access)

### Security Preparation

- [ ] Firewall software available (ufw, iptables, etc.)
- [ ] SSL certificates obtained (or plan for self-signed)
- [ ] VPN access configured for administrative tasks
- [ ] Backup storage location identified
- [ ] Password management system ready

## Deployment Checklist

### Phase 1: Initial Setup (15-30 minutes)

#### 1.1 Copy Project Files

- [ ] Project files copied to server at `/tmp/quote-app`
- [ ] All files have correct permissions
- [ ] Scripts are executable (`chmod +x scripts/*.sh`)

#### 1.2 Run Automated Setup

```bash
cd /tmp/quote-app/scripts
sudo ./setup-selfhosted.sh
```

- [ ] Setup script executed successfully
- [ ] All Docker images pulled
- [ ] Containers started
- [ ] Database initialized
- [ ] Migrations applied
- [ ] Health checks passed

#### 1.3 Verify Installation

- [ ] Application accessible at http://localhost:8080
- [ ] Supabase Studio accessible at http://localhost:3000
- [ ] Supabase API responding at http://localhost:8000
- [ ] PostgreSQL accessible on port 5432
- [ ] Mail UI accessible at http://localhost:9000

#### 1.4 Review Generated Configuration

- [ ] Environment file reviewed: `/opt/quote-app/.env`
- [ ] JWT secrets generated and secured
- [ ] PostgreSQL password recorded
- [ ] API keys documented
- [ ] Configuration backed up securely

### Phase 2: Security Configuration (30-60 minutes)

#### 2.1 Change Default Credentials

- [ ] PostgreSQL password changed
- [ ] JWT secrets regenerated (if needed)
- [ ] `.env` file permissions set to 600
- [ ] Backup of `.env` created in secure location

#### 2.2 SSL Certificate Setup

**For Self-Signed (Testing)**:
- [ ] Self-signed certificate generated (done by setup script)
- [ ] Certificate location verified: `/opt/quote-app/ssl/`

**For Production**:
- [ ] Company-issued certificate obtained
- [ ] Certificate copied to `/opt/quote-app/ssl/cert.pem`
- [ ] Private key copied to `/opt/quote-app/ssl/key.pem`
- [ ] Certificate permissions set correctly (644 for cert, 600 for key)
- [ ] Nginx restarted: `docker-compose restart nginx-proxy`
- [ ] HTTPS access verified

#### 2.3 Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS

# Restrict admin interfaces to internal network
sudo ufw allow from 192.168.0.0/16 to any port 3000  # Supabase Studio
sudo ufw allow from 192.168.0.0/16 to any port 5432  # PostgreSQL

sudo ufw enable
```

- [ ] Firewall rules configured
- [ ] SSH access tested
- [ ] HTTP/HTTPS access tested from client machines
- [ ] Admin interfaces accessible from internal network only

#### 2.4 Network Isolation

- [ ] Docker network verified: `docker network ls`
- [ ] Services only accessible via nginx proxy
- [ ] Direct database access restricted to internal network
- [ ] API gateway (Kong) properly configured

### Phase 3: Application Configuration (30-45 minutes)

#### 3.1 Database Configuration

- [ ] Access Supabase Studio at http://localhost:3000
- [ ] Connect using `SERVICE_ROLE_KEY` from `.env`
- [ ] Verify all tables created (run query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`)
- [ ] Verify RLS policies enabled (run query: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`)
- [ ] Review and customize RLS policies if needed

#### 3.2 Create Initial Users

**First Admin User**:
- [ ] Navigate to application UI: http://localhost:8080
- [ ] Create first user via sign-up form
- [ ] Record admin user credentials securely
- [ ] Login with admin credentials

**Assign Admin Role** (via Supabase Studio):
```sql
-- Get user ID
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Assign admin role
INSERT INTO user_roles (user_id, role, email)
VALUES ('<user-id>', 'ADMIN', 'admin@example.com');
```

- [ ] First admin user created
- [ ] Admin role assigned
- [ ] Admin user can access all features

#### 3.3 Configure Application Settings

In Supabase Studio, configure `app_configurations` table:

```sql
-- View current configuration
SELECT * FROM app_configurations;

-- Update ERP settings (example)
UPDATE app_configurations
SET config_value = '{"enabled": true, "url": "http://erp-server/api"}'
WHERE config_key = 'erp_integration';
```

- [ ] ERP integration settings configured
- [ ] Import API credentials set up
- [ ] Email settings configured (if using production SMTP)
- [ ] Other application settings reviewed

#### 3.4 Set Up Approval Limits

```sql
-- View default approval limits
SELECT * FROM role_approval_limits;

-- Customize as needed
UPDATE role_approval_limits
SET max_amount = 50000
WHERE role = 'MANAGER';
```

- [ ] Approval limits reviewed
- [ ] Limits customized for organization
- [ ] Tested approval workflow

### Phase 4: Data Import (30-60 minutes)

#### 4.1 Prepare Import API Credentials

In `app_configurations` table:
```sql
-- Set import API credentials
INSERT INTO app_configurations (config_key, config_value, category)
VALUES (
  'import_api_auth',
  '{"enabled": true, "api_key": "your-secure-api-key"}',
  'security'
);
```

- [ ] Import API credentials configured
- [ ] API key generated and secured
- [ ] Import endpoints accessible

#### 4.2 Import Customer Data

```bash
# Test customer import
curl -X POST http://localhost:8000/functions/v1/import-customers \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d @customer-samples.json
```

- [ ] Customer import API tested
- [ ] Sample customers imported
- [ ] Customer data verified in database
- [ ] Customer addresses and contacts linked

#### 4.3 Import Product Catalog

```bash
# Test product import
curl -X POST http://localhost:8000/functions/v1/import-products \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d @product-samples.json
```

- [ ] Product import API tested
- [ ] Sample products imported
- [ ] Product data verified in database

#### 4.4 Import Cross-References

```bash
# Test cross-reference import
curl -X POST http://localhost:8000/functions/v1/import-cross-references \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d @cross-ref-samples.json
```

- [ ] Cross-reference import API tested
- [ ] Sample cross-references imported
- [ ] Cross-reference data verified

### Phase 5: Testing & Validation (1-2 hours)

#### 5.1 Functional Testing

- [ ] User registration works
- [ ] User login works
- [ ] Password reset works (if email configured)
- [ ] Create new quote
- [ ] Add line items to quote
- [ ] Search products
- [ ] Cross-reference lookup works
- [ ] Cost calculation accurate
- [ ] Quote approval workflow functions
- [ ] Customer management works
- [ ] Product management works

#### 5.2 Security Testing

- [ ] Unauthenticated access blocked
- [ ] RLS policies prevent unauthorized data access
- [ ] API requires authentication
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Rate limiting works on edge functions
- [ ] HTTPS redirect works (if configured)

#### 5.3 Performance Testing

- [ ] Application loads in < 3 seconds
- [ ] Quote creation completes quickly
- [ ] Search returns results in < 1 second
- [ ] Large quotes (100+ line items) perform well
- [ ] Concurrent users supported (test with 5-10 users)
- [ ] Database queries optimized (check slow query log)

#### 5.4 Integration Testing

- [ ] ERP API connectivity tested (if configured)
- [ ] Import APIs work end-to-end
- [ ] Export functionality works
- [ ] Email notifications send (if configured)
- [ ] Realtime updates work across users

### Phase 6: Backup & Monitoring (30-45 minutes)

#### 6.1 Configure Automated Backups

```bash
# Add to root crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/quote-app/scripts/migrate-db.sh backup

# Weekly cleanup (keep 30 days)
0 3 * * 0 find /opt/quote-app/backups -name "backup_*.sql.gz" -mtime +30 -delete
```

- [ ] Backup script tested manually
- [ ] Automated backup scheduled
- [ ] Backup retention policy configured
- [ ] Backup storage location has sufficient space
- [ ] Backup restore tested successfully

#### 6.2 Set Up Monitoring

```bash
# Add health check to crontab
*/5 * * * * /opt/quote-app/scripts/docker-health.sh > /var/log/quote-app-health.log 2>&1
```

- [ ] Health check script tested
- [ ] Automated health checks scheduled
- [ ] Log rotation configured
- [ ] Disk space monitoring set up
- [ ] Container resource limits reviewed

#### 6.3 Configure Alerting

- [ ] Email alerts configured for critical errors
- [ ] Disk space alerts set up (threshold: 80%)
- [ ] Service failure alerts configured
- [ ] Database backup failure alerts set up
- [ ] Contact escalation procedures documented

### Phase 7: Documentation (30-60 minutes)

#### 7.1 Document Configuration

- [ ] Server IP/hostname documented
- [ ] Access URLs documented
- [ ] Admin credentials stored in password manager
- [ ] API keys stored securely
- [ ] SSL certificate details documented
- [ ] Firewall rules documented

#### 7.2 Create Runbooks

- [ ] Restart procedure documented
- [ ] Backup/restore procedure documented
- [ ] Update procedure documented
- [ ] Troubleshooting guide created
- [ ] Emergency contact list created

#### 7.3 User Documentation

- [ ] User guide created or updated
- [ ] Training materials prepared
- [ ] Video tutorials recorded (optional)
- [ ] FAQ document created
- [ ] Support contact information documented

### Phase 8: User Onboarding (Variable)

#### 8.1 Create User Accounts

- [ ] All users created in application
- [ ] Roles assigned appropriately:
  - [ ] Administrators
  - [ ] Managers
  - [ ] Sales Representatives
  - [ ] CSRs
- [ ] Initial passwords provided securely
- [ ] Users instructed to change passwords on first login

#### 8.2 Conduct Training

- [ ] Admin training completed
- [ ] Manager training completed
- [ ] Sales team training completed
- [ ] CSR training completed
- [ ] Training materials distributed

#### 8.3 Pilot Testing

- [ ] Pilot group identified (5-10 users)
- [ ] Pilot users testing application
- [ ] Feedback collected
- [ ] Issues documented and resolved
- [ ] Pilot phase successful

## Production Launch Checklist

### Pre-Launch Final Checks (1 hour before)

- [ ] Run comprehensive health check: `sudo /opt/quote-app/scripts/docker-health.sh`
- [ ] Verify all services running: `docker-compose ps`
- [ ] Test application access from multiple client machines
- [ ] Verify database backup completed recently
- [ ] Check disk space: `df -h`
- [ ] Review logs for errors: `docker-compose logs --tail 100`
- [ ] Confirm support team on standby

### Launch

- [ ] Announce go-live to users
- [ ] Monitor logs in real-time: `docker-compose logs -f`
- [ ] Watch health metrics: `docker stats`
- [ ] Monitor user feedback
- [ ] Track any issues in issue tracking system

### Post-Launch (First Week)

- [ ] Daily health checks
- [ ] Review logs daily for errors
- [ ] Monitor disk space
- [ ] Verify backups completing
- [ ] Collect user feedback
- [ ] Document any issues and resolutions
- [ ] Adjust configuration as needed

## Maintenance Schedule

### Daily Tasks

- [ ] Check health check logs
- [ ] Review error logs
- [ ] Monitor disk space
- [ ] Verify backups completed

### Weekly Tasks

- [ ] Run comprehensive health check
- [ ] Review security logs
- [ ] Test backup restore
- [ ] Update user documentation as needed
- [ ] Review user feedback

### Monthly Tasks

- [ ] Update Docker images: `docker-compose pull`
- [ ] Review and optimize database performance
- [ ] Audit user access and roles
- [ ] Review and update RLS policies
- [ ] Test disaster recovery procedures

### Quarterly Tasks

- [ ] Security audit
- [ ] Update SSL certificates (if needed)
- [ ] Review and update documentation
- [ ] Conduct user training refresher
- [ ] Capacity planning review

## Emergency Procedures

### Application Down

1. Check container status: `docker-compose ps`
2. Check logs: `docker-compose logs`
3. Restart services: `docker-compose restart`
4. If restart fails, restore from backup
5. Contact support team

### Database Issues

1. Check PostgreSQL: `docker exec supabase-postgres pg_isready`
2. Review logs: `docker logs supabase-postgres`
3. Attempt restart: `docker-compose restart postgres`
4. If data corruption suspected, restore from backup
5. Contact database administrator

### Security Incident

1. Immediately isolate affected systems
2. Review security logs
3. Change all credentials
4. Document incident
5. Contact security team
6. Review and update security policies

## Sign-Off

### Deployment Team

- [ ] Infrastructure Engineer: _________________ Date: _______
- [ ] Database Administrator: _________________ Date: _______
- [ ] Application Developer: _________________ Date: _______
- [ ] Security Officer: _________________ Date: _______

### Approvals

- [ ] IT Manager: _________________ Date: _______
- [ ] Security Manager: _________________ Date: _______
- [ ] Business Stakeholder: _________________ Date: _______

## Notes

Use this section to document any issues, deviations from the checklist, or important notes about the deployment:

```
Date: _______________

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Deployment Date**: _______________
**Go-Live Date**: _______________
**Completed By**: _______________
