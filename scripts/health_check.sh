#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Mettu Karl Referral Hospital - Comprehensive System Health Check
# Queries API liveness, readiness, database, Redis, and metrics endpoints.
# ==============================================================================

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "=========================================="
echo "Mettu Karl HIS - System Health Diagnostics"
echo "=========================================="

# 1. Backend Liveness Probe
echo -n "[1/5] Checking Backend Liveness (${BACKEND_URL}/api/v1/health)... "
LIVE_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/v1/health" || echo "FAILED")
if [ "${LIVE_HTTP_CODE}" == "200" ]; then
  echo "✅ OK (HTTP 200)"
else
  echo "❌ FAIL (Status: ${LIVE_HTTP_CODE})"
fi

# 2. Backend Readiness Probe (DB & Redis)
echo -n "[2/5] Checking Backend Readiness (${BACKEND_URL}/api/v1/readiness)... "
READY_BODY=$(curl -s "${BACKEND_URL}/api/v1/readiness" || echo '{"status":"failed"}')
READY_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/v1/readiness" || echo "FAILED")
if [ "${READY_HTTP_CODE}" == "200" ]; then
  echo "✅ OK (HTTP 200)"
  echo "      Details: ${READY_BODY}"
else
  echo "❌ NOT READY (Status: ${READY_HTTP_CODE})"
  echo "      Details: ${READY_BODY}"
fi

# 3. Prometheus Metrics Endpoint
echo -n "[3/5] Checking Prometheus Metrics (${BACKEND_URL}/metrics)... "
METRICS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/metrics" || echo "FAILED")
if [ "${METRICS_CODE}" == "200" ]; then
  echo "✅ OK (HTTP 200)"
else
  echo "⚠️ WARN (Status: ${METRICS_CODE})"
fi

# 4. Frontend PWA Check
echo -n "[4/5] Checking Frontend Web Interface (${FRONTEND_URL}/login)... "
FE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/login" || echo "FAILED")
if [ "${FE_CODE}" == "200" ] || [ "${FE_CODE}" == "307" ] || [ "${FE_CODE}" == "308" ]; then
  echo "✅ OK (HTTP ${FE_CODE})"
else
  echo "❌ FAIL (Status: ${FE_CODE})"
fi

# 5. Kubernetes Pod Status (if in K8s context)
if command -v kubectl &> /dev/null; then
  echo "[5/5] Kubernetes Cluster Pods in 'mettu-karl-his':"
  kubectl get pods -n mettu-karl-his --no-headers 2>/dev/null || echo "      (Could not connect to K8s cluster)"
else
  echo "[5/5] kubectl not found; skipping K8s pod query."
fi

echo "=========================================="
echo "Diagnostic Finished."
echo "=========================================="
