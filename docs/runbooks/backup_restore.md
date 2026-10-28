# Runbook: Backup & Disaster Recovery Procedures

## 1. Overview & Policy

- **Backup Frequency**:
  - Full Database Dumps: Daily at 01:00 AM EAT.
  - Incremental WAL Archives: Every 15 minutes.
  - MinIO Imagery Sync: Daily at 03:00 AM EAT.
- **Encryption**: AES-256-CBC via OpenSSL using PBKDF2 key derivation.
- **Retention**: 30 days locally on-prem; 90 days in offsite cloud storage.

---

## 2. Triggering a Manual Backup

Run the automated backup script from the host server or administrative workstation:

```bash
export BACKUP_ENCRYPTION_KEY="YourSecureHospitalEncryptionKey"
export BACKUP_DIR="/var/backups/mettu-karl-his"
./scripts/backup.sh
```

### Verification Steps
Check that the backup archive and its corresponding SHA256 checksum file exist:

```bash
ls -lh /var/backups/mettu-karl-his/
sha256sum -c his_backup_<TIMESTAMP>.tar.enc.sha256
```

---

## 3. Restoring from Backup

### Step 3.1: Scenario 1 - Database Corruption or Accidental Loss

1. Identify the latest clean backup file.
2. Put the application into maintenance mode:
   ```bash
   kubectl scale deployment his-backend --replicas=0 -n mettu-karl-his
   ```
3. Execute the restore script:
   ```bash
   ./scripts/restore.sh /var/backups/mettu-karl-his/his_backup_20261026_120000.tar.enc "YourSecureHospitalEncryptionKey"
   ```
4. Verify database health:
   ```bash
   kubectl exec -it postgres-0 -n mettu-karl-his -- psql -U mettu_his_admin -d mettu_karl_his -c "SELECT count(*) FROM patients;"
   ```
5. Restore application pods:
   ```bash
   kubectl scale deployment his-backend --replicas=3 -n mettu-karl-his
   ```

---

## 4. Monthly Disaster Recovery Drill

Every 30 days, the IT department must execute a mock restore onto a non-production staging environment to verify that:
1. The backup decrypts cleanly.
2. RTO remains under 1 hour.
3. Patient demographic counts and MRN integrity match 100%.
