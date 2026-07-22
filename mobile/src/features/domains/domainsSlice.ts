import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AdsFileKind, DomainsState, DomainType, MonitoredDomain } from '@/types';
import * as domainService from '@/services/firebase/domains';
import { realmService } from '@/services/realm/realmService';

const initialState: DomainsState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchDomains = createAsyncThunk('domains/fetch', async (userId: string) => {
  const remote = await domainService.getDomains(userId);
  realmService.saveDomains(remote);
  return remote;
});

export const addDomain = createAsyncThunk(
  'domains/add',
  async (
    {
      userId,
      name,
      identifier,
      type,
      monitoredFiles,
      notificationsEnabled = true,
    }: {
      userId: string;
      name: string;
      identifier: string;
      type: DomainType;
      monitoredFiles: AdsFileKind[];
      notificationsEnabled?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const domain = await domainService.addDomain(userId, {
        name,
        identifier,
        type,
        monitoredFiles,
        notificationsEnabled,
      });
      realmService.saveDomain(domain);
      return domain;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add domain';
      return rejectWithValue(message);
    }
  }
);

export const setDomainNotifications = createAsyncThunk(
  'domains/setNotifications',
  async ({
    userId,
    domainId,
    enabled,
  }: {
    userId: string;
    domainId: string;
    enabled: boolean;
  }) => {
    await domainService.setDomainNotifications(userId, domainId, enabled);
    return { domainId, enabled };
  }
);

export const resolveAppHostDomain = createAsyncThunk(
  'domains/resolveHost',
  async (
    { userId, domain }: { userId: string; domain: MonitoredDomain },
    { rejectWithValue }
  ) => {
    try {
      const updated = await domainService.ensureAppHostDomain(userId, domain);
      realmService.saveDomain(updated);
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not resolve developer website';
      return rejectWithValue(message);
    }
  }
);

export const removeDomain = createAsyncThunk(
  'domains/remove',
  async ({ userId, domainId }: { userId: string; domainId: string }) => {
    await domainService.removeDomain(userId, domainId);
    realmService.deleteDomain(domainId);
    return domainId;
  }
);

export const loadDomainsOffline = createAsyncThunk('domains/loadOffline', async (userId: string) => {
  return realmService.getDomains(userId);
});

const domainsSlice = createSlice({
  name: 'domains',
  initialState,
  reducers: {
    updateDomainStatus: (
      state,
      action: PayloadAction<{ id: string; status: MonitoredDomain['status']; lastCheckedAt: string }>
    ) => {
      const domain = state.items.find((d) => d.id === action.payload.id);
      if (domain) {
        domain.status = action.payload.status;
        domain.lastCheckedAt = action.payload.lastCheckedAt;
      }
    },
    updateDomainHost: (
      state,
      action: PayloadAction<{ id: string; hostDomain: string; developerUrl?: string }>
    ) => {
      const domain = state.items.find((d) => d.id === action.payload.id);
      if (domain) {
        domain.hostDomain = action.payload.hostDomain;
        domain.developerUrl = action.payload.developerUrl;
      }
    },
    clearDomainsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDomains.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch domains';
      })
      .addCase(addDomain.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(addDomain.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to add domain';
      })
      .addCase(setDomainNotifications.fulfilled, (state, action) => {
        const domain = state.items.find((d) => d.id === action.payload.domainId);
        if (domain) {
          domain.notificationsEnabled = action.payload.enabled;
        }
      })
      .addCase(resolveAppHostDomain.fulfilled, (state, action) => {
        const index = state.items.findIndex((d) => d.id === action.payload.id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
      })
      .addCase(removeDomain.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.id !== action.payload);
      })
      .addCase(loadDomainsOffline.fulfilled, (state, action) => {
        if (action.payload.length > 0) {
          state.items = action.payload;
        }
      });
  },
});

export const { updateDomainStatus, updateDomainHost, clearDomainsError } = domainsSlice.actions;
export default domainsSlice.reducer;
