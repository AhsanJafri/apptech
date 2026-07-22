import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ChecksState, MonitoredDomain } from '@/types';
import * as checkService from '@/services/firebase/checks';
import * as domainService from '@/services/firebase/domains';
import * as sellerLineService from '@/services/firebase/sellerLines';
import { checkDomainFiles } from '@/services/adsTxt/checker';
import { aggregateTrackedLineStatusUpdates } from '@/utils/sellerLine';
import { realmService } from '@/services/realm/realmService';

const initialState: ChecksState = {
  byDomainId: {},
  isLoading: false,
  error: null,
};

export const fetchCheckHistory = createAsyncThunk(
  'checks/fetchHistory',
  async ({ userId, domainId }: { userId: string; domainId: string }) => {
    const remote = await checkService.getCheckHistory(userId, domainId);
    realmService.saveChecks(remote);
    return { domainId, checks: remote };
  }
);

export const runManualCheck = createAsyncThunk(
  'checks/runManual',
  async ({ userId, domain }: { userId: string; domain: MonitoredDomain }, { rejectWithValue }) => {
    try {
      const resolved = await domainService.ensureAppHostDomain(userId, domain);
      if (resolved.hostDomain && resolved.hostDomain !== domain.hostDomain) {
        realmService.saveDomain(resolved);
      }

      const trackedLines = await sellerLineService.getSellerLinesForDomain(userId, domain.id);

      const adsResult = await checkDomainFiles(
        resolved.id,
        resolved.identifier,
        resolved.type,
        resolved.monitoredFiles,
        resolved.hostDomain,
        trackedLines
      );
      const saved = await checkService.saveCheckResult(userId, domain.id, adsResult);

      const statusUpdates = aggregateTrackedLineStatusUpdates(adsResult.files ?? [], saved.checkedAt);
      if (statusUpdates.length > 0) {
        await sellerLineService.updateSellerLineStatuses(userId, statusUpdates);
      }
      try {
        realmService.saveCheck(saved);
      } catch {
        // Offline cache is best-effort; don't fail the check if Realm write fails
      }
      await checkService.updateDomainAfterCheck(userId, domain.id, saved);
      return { domainId: domain.id, check: saved, domain: resolved };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check failed';
      return rejectWithValue(message);
    }
  }
);

export const loadChecksOffline = createAsyncThunk(
  'checks/loadOffline',
  async (domainId: string) => {
    return { domainId, checks: realmService.getChecks(domainId) };
  }
);

const checksSlice = createSlice({
  name: 'checks',
  initialState,
  reducers: {
    clearChecksError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCheckHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCheckHistory.fulfilled, (state, action) => {
        state.byDomainId[action.payload.domainId] = action.payload.checks;
        state.isLoading = false;
      })
      .addCase(fetchCheckHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch check history';
      })
      .addCase(runManualCheck.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(runManualCheck.fulfilled, (state, action) => {
        const { domainId, check } = action.payload;
        if (!state.byDomainId[domainId]) {
          state.byDomainId[domainId] = [];
        }
        state.byDomainId[domainId].unshift(check);
        state.isLoading = false;
      })
      .addCase(runManualCheck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Check failed';
      })
      .addCase(loadChecksOffline.fulfilled, (state, action) => {
        const { domainId, checks } = action.payload;
        if (checks.length > 0) {
          state.byDomainId[domainId] = checks;
        }
      });
  },
});

export const { clearChecksError } = checksSlice.actions;
export default checksSlice.reducer;
