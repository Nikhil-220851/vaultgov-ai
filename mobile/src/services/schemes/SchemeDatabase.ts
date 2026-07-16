import AsyncStorage from '@react-native-async-storage/async-storage';
import { SchemeRecord } from './types';

const STORAGE_KEY = 'vaultgov_local_schemes';
const SCHEMA_VERSION_KEY = 'vaultgov_scheme_schema_version';
const CURRENT_SCHEMA_VERSION = 4; // Bumped to 4 to force clear dummy seeds

const INITIAL_SCHEMES: SchemeRecord[] = [];

export const SchemeDatabase = {
  /**
   * Initializes the database. If no data exists or the schema version has changed
   * (e.g. old dummy data cached from a prior app version), clears stale data and
   * reseeds with the current INITIAL_SCHEMES. Also archives expired schemes.
   */
  async initDatabase(): Promise<void> {
    try {
      const storedVersion = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
      const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

      if (currentVersion < CURRENT_SCHEMA_VERSION) {
        // Schema has changed — clear stale data and reseed
        console.log(
          `[SchemeDatabase] Schema version mismatch (stored=${currentVersion}, current=${CURRENT_SCHEMA_VERSION}). Clearing stale data and reseeding...`
        );
        await AsyncStorage.removeItem(STORAGE_KEY);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCHEMES));
        await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
      } else {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          console.log('[SchemeDatabase] Database empty. Seeding INITIAL_SCHEMES...');
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCHEMES));
        }
      }

      await this.archiveExpiredSchemes();
    } catch (err) {
      console.error('[SchemeDatabase] Failed to init database:', err);
    }
  },

  /**
   * Reads all stored schemes, archives those whose applicationEnd has passed,
   * and saves back to database.
   */
  async archiveExpiredSchemes(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return 0;

      const schemes: SchemeRecord[] = JSON.parse(stored);
      const today = new Date();
      let archivedCount = 0;

      const modifiedSchemes = schemes.map((s) => {
        if (s.status !== 'Archived' && s.status !== 'Disabled' && s.applicationEnd !== 'Permanent') {
          const end = new Date(s.applicationEnd);
          if (!isNaN(end.getTime()) && end < today) {
            console.log(`[SchemeDatabase] Scheme ${s.schemeId} (${s.title}) has expired. Archiving...`);
            s.status = 'Archived';
            archivedCount++;
          }
        }
        return s;
      });

      if (archivedCount > 0) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(modifiedSchemes));
      }
      return archivedCount;
    } catch (err) {
      console.error('[SchemeDatabase] Failed to archive expired schemes:', err);
      return 0;
    }
  },

  /**
   * Returns active schemes (excluding Archived and Disabled).
   */
  async getActiveSchemes(): Promise<SchemeRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const schemes: SchemeRecord[] = JSON.parse(stored);
      return schemes.filter((s) => s.status !== 'Archived' && s.status !== 'Disabled');
    } catch (err) {
      console.error('[SchemeDatabase] Failed to get active schemes:', err);
      return [];
    }
  },

  /**
   * Returns all schemes (including archived).
   */
  async getAllSchemes(): Promise<SchemeRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (err) {
      console.error('[SchemeDatabase] Failed to get all schemes:', err);
      return [];
    }
  },

  /**
   * Inserts or updates a scheme record.
   */
  async insertScheme(scheme: SchemeRecord): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const schemes: SchemeRecord[] = stored ? JSON.parse(stored) : [];
      const index = schemes.findIndex((s) => s.schemeId === scheme.schemeId);
      
      if (index >= 0) {
        schemes[index] = scheme;
      } else {
        schemes.push(scheme);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schemes));
      await this.archiveExpiredSchemes();
    } catch (err) {
      console.error('[SchemeDatabase] Failed to insert scheme:', err);
    }
  }
};
