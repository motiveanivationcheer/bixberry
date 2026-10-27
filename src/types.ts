export type BixberryConnectionStatus = 'Connected' | 'Disconnected' | 'Session Expired';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  bixberryConnected: boolean;
  bixberryEmail?: string;
  bixberryStatus: BixberryConnectionStatus | 'pending_verification' | 'auth_failed';
  lastSyncTimestamp?: string;
  currentBalance?: number;
  totalEarned?: number;
  activeNodesCount?: number;
  subscriptionTier?: 'free' | 'monthly_pro' | 'yearly_pro';
  subscriptionStatus?: 'inactive' | 'active' | 'expired' | 'cancelled';
  subscriptionExpiresAt?: string;
  updatedAt: string;
  createdAt: string;
}

export interface BalanceSnapshot {
  id: string;
  userId: string;
  confirmedBalance: number;
  pendingBalance?: number;
  currency: string;
  source: string;
  syncStatus: 'verified' | 'pending_auth' | 'sync_failed' | 'api_unavailable';
  syncTimestamp: string;
}

export interface ConnectionLog {
  id: string;
  userId: string;
  event: 'probe' | 'keep_alive' | 'reconnect' | 'disconnect' | 'error' | 'session_check';
  status: 'success' | 'failure' | 'timeout' | 'recovered';
  endpoint?: string;
  latencyMs?: number;
  httpStatus?: number;
  details?: string;
  timestamp: string;
}

export interface EarningRecord {
  id: string;
  userId: string;
  date: string;
  dataProcessedMb: number;
  uptimeHours: number;
  amountEarnedUsd: number;
  status?: 'confirmed' | 'pending' | 'processing';
  transactionId?: string;
  isOptimized: boolean;
  notes?: string;
  createdAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: 'monthly_pro' | 'yearly_pro';
  planName: string;
  amount: number;
  currency: string;
  status: 'active' | 'completed' | 'refunded' | 'expired' | 'cancelled';
  paymentReference: string;
  paymentProvider?: string;
  startDate: string;
  expiresAt: string;
  autoRenew?: boolean;
  createdAt: string;
}

export interface BoosterSetting {
  userId: string;
  keepAwakeEnabled: boolean;
  autoPingIntervalSec: number;
  alertOnHighLatency: boolean;
  alertOnDisconnection: boolean;
  thermalWatchdogEnabled?: boolean;
  updatedAt: string;
}

export interface NetworkMetrics {
  currentLatency: number;
  jitter: number;
  minLatency: number;
  maxLatency: number;
  avgLatency: number;
  packetLoss: number;
  stabilityScore: number;
  isOnline: boolean;
  connectionType: string;
  downlinkSpeed?: number;
  effectiveType?: string;
  publicIp?: string;
  history: { time: string; latency: number }[];
}

export interface DeviceHealth {
  batteryLevel: number | null; // 0 - 100
  isCharging: boolean | null;
  wakeLockActive: boolean;
  thermalStatus: 'normal' | 'warm' | 'throttled';
  eventLoopDelayMs: number;
  memoryUsageMb: number | null;
  backgroundGuidanceDone: {
    batteryExemption: boolean;
    backgroundData: boolean;
    appPinning: boolean;
    dozeMode: boolean;
  };
}

export interface BixberryConnectionState {
  reachable: boolean | null;
  httpStatus: number | null;
  responseTimeMs: number | null;
  verified: boolean;
  authenticated: boolean;
  accountEmail: string | null;
  statusMessage: string;
  apiDocsPublished: boolean;
  apiAccessStatus: 'unavailable_public' | 'authorized_private' | 'adapter_standby';
  lastChecked: string | null;
  sessionExpiresAt?: string | null;
}

export type ScreenId = 
  | 'dashboard'
  | 'connector'
  | 'balance'
  | 'earnings'
  | 'optimization'
  | 'subscriptions'
  | 'payments'
  | 'settings'
  | 'support';
