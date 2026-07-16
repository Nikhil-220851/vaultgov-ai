import { SchemeRecord, SyncStatus, SyncType } from './types';
import { SchemeDatabase } from './SchemeDatabase';
import { apiClient } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  added: number;
  updated: number;
  archived: number;
  message: string;
}

// ─── Core Sync Service ────────────────────────────────────────────────────────

const LAST_SYNC_TIME_KEY = 'vaultgov_schemes_last_sync_time';

export class SchemeSyncService {
  private syncStatus: SyncStatus = 'idle';

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Performs the delta sync cycle:
   * 1. Fetch remote schemes from backend using the last saved serverTime as 'since'.
   * 2. Compare version and contentHash against local DB.
   * 3. Insert new schemes; update changed ones; mark archived/disabled schemes.
   * 4. Save and use the backend's serverTime for the next sync.
   *
   * Returns a detailed SyncResult describing what changed.
   */
  async sync(type: SyncType = 'auto'): Promise<SyncResult> {
    if (this.syncStatus === 'syncing') {
      return {
        success: false,
        added: 0,
        updated: 0,
        archived: 0,
        message: 'Sync already in progress.',
      };
    }

    console.log(`[SchemeSyncService] Starting ${type} sync…`);
    this.syncStatus = 'syncing';

    let added = 0;
    let updated = 0;
    let archived = 0;

    try {
      // 1. Fetch from remote using last sync serverTime
      const since = await AsyncStorage.getItem(LAST_SYNC_TIME_KEY);
      const response = await apiClient.syncSchemes(since);

      // Load local schemes for comparison
      const localSchemes = await SchemeDatabase.getAllSchemes();
      const localMap = new Map<string, SchemeRecord>(
        localSchemes.map((s) => [s.schemeId, s])
      );

      // 2. Process new schemes
      if (response.newSchemes && response.newSchemes.length > 0) {
        for (const remote of response.newSchemes) {
          const local = localMap.get(remote.schemeId);
          if (!local) {
            await SchemeDatabase.insertScheme(remote);
            added++;
            console.log(`[SchemeSyncService] ➕ Added new scheme: ${remote.title}`);
          } else {
            // Safety check for duplication — if exists, compare version / hash
            const versionChanged = remote.version > (local.version ?? 0);
            const hashChanged = remote.contentHash !== local.contentHash;
            if (versionChanged || hashChanged) {
              await SchemeDatabase.insertScheme(remote);
              updated++;
              console.log(`[SchemeSyncService] 🔄 Updated duplicate-match scheme: ${remote.title}`);
            }
          }
        }
      }

      // 3. Process updated schemes
      if (response.updatedSchemes && response.updatedSchemes.length > 0) {
        for (const remote of response.updatedSchemes) {
          const local = localMap.get(remote.schemeId);
          if (!local) {
            await SchemeDatabase.insertScheme(remote);
            added++;
            console.log(`[SchemeSyncService] ➕ Added missing updated scheme: ${remote.title}`);
          } else {
            const versionChanged = remote.version > (local.version ?? 0);
            const hashChanged = remote.contentHash !== local.contentHash;
            if (versionChanged || hashChanged) {
              await SchemeDatabase.insertScheme(remote);
              updated++;
              console.log(`[SchemeSyncService] 🔄 Updated scheme: ${remote.title}`);
            } else {
              console.log(`[SchemeSyncService] ✅ No change (hash match): ${remote.title}`);
            }
          }
        }
      }

      // 4. Process archived / disabled schemes
      if (response.archivedSchemes && response.archivedSchemes.length > 0) {
        for (const remote of response.archivedSchemes) {
          const local = localMap.get(remote.schemeId);
          if (local) {
            await SchemeDatabase.insertScheme({
              ...local,
              status: remote.status || 'Archived',
              version: remote.version,
              lastUpdated: remote.lastUpdated,
            });
            archived++;
            console.log(`[SchemeSyncService] 🗄️ Soft-archived/disabled scheme: ${remote.title}`);
          }
        }
      }

      // 5. Run local expiry auto-archiver as fallback
      const localExpiryCount = await SchemeDatabase.archiveExpiredSchemes();
      archived += localExpiryCount;

      // 6. Save backend server time for subsequent requests
      await AsyncStorage.setItem(LAST_SYNC_TIME_KEY, response.serverTime);

      this.syncStatus = 'success';

      const totalChanged = added + updated + archived;
      const message =
        totalChanged === 0
          ? 'Your schemes are already up to date.'
          : `Updated ${totalChanged} scheme${totalChanged !== 1 ? 's' : ''} (${added} new, ${updated} refreshed${archived > 0 ? `, ${archived} archived` : ''}).`;

      console.log(`[SchemeSyncService] Sync complete — ${message}`);
      return { success: true, added, updated, archived, message };
    } catch (err) {
      console.error('[SchemeSyncService] Sync failed:', err);
      this.syncStatus = 'error';
      return {
        success: false,
        added,
        updated,
        archived,
        message: 'Sync failed. Please check your connection and try again.',
      };
    } finally {
      setTimeout(() => {
        if (this.syncStatus !== 'syncing') {
          this.syncStatus = 'idle';
        }
      }, 5000);
    }
  }

  async setupAutoSync(): Promise<void> {
    // Recurring sync every 24 hours
  }
}

// Export singleton
export const schemeSyncService = new SchemeSyncService();
