import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SellerLinesState, TrackedLineMatchMode, TrackedSellerLine } from '@/types';
import * as sellerLineService from '@/services/firebase/sellerLines';
import { runManualCheck } from '@/features/checks/checksSlice';
import type { RootState } from '@/app/store';

const initialState: SellerLinesState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchSellerLines = createAsyncThunk(
  'sellerLines/fetchAll',
  async (userId: string) => sellerLineService.getSellerLines(userId)
);

export const addSellerLine = createAsyncThunk(
  'sellerLines/add',
  async ({
    userId,
    domainId,
    sellerDomain,
    publisherId,
    relationship,
    matchMode,
    fileType,
    label,
  }: {
    userId: string;
    domainId: string;
    sellerDomain: string;
    publisherId: string;
    relationship: 'DIRECT' | 'RESELLER';
    matchMode: TrackedLineMatchMode;
    fileType?: TrackedSellerLine['fileType'];
    label?: string;
  }) =>
    sellerLineService.addSellerLine(userId, {
      domainId,
      sellerDomain,
      publisherId,
      relationship,
      matchMode,
      fileType,
      label,
    })
);

export const removeSellerLine = createAsyncThunk(
  'sellerLines/remove',
  async ({ userId, lineId }: { userId: string; lineId: string }) => {
    await sellerLineService.removeSellerLine(userId, lineId);
    return lineId;
  }
);

export const refreshTrackedLineChecks = createAsyncThunk(
  'sellerLines/refreshChecks',
  async (userId: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const domainIds = [...new Set(state.sellerLines.items.map((line) => line.domainId))];

    for (const domainId of domainIds) {
      const domain = state.domains.items.find((item) => item.id === domainId);
      if (domain) {
        await dispatch(runManualCheck({ userId, domain }));
      }
    }

    return sellerLineService.getSellerLines(userId);
  }
);

const sellerLinesSlice = createSlice({
  name: 'sellerLines',
  initialState,
  reducers: {
    clearSellerLinesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerLines.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSellerLines.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchSellerLines.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to load seller lines';
      })
      .addCase(addSellerLine.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(removeSellerLine.fulfilled, (state, action) => {
        state.items = state.items.filter((line) => line.id !== action.payload);
      })
      .addCase(runManualCheck.fulfilled, (state, action) => {
        const check = action.payload.check;
        const updates = (check.files ?? []).flatMap((file) => file.trackedLineResults ?? []);
        const best = new Map<string, (typeof updates)[number]['status']>();
        const rank: Record<string, number> = {
          found: 4,
          relationship_mismatch: 3,
          missing: 2,
          unknown: 1,
        };

        for (const update of updates) {
          const current = best.get(update.lineId);
          if (!current || rank[update.status] > rank[current]) {
            best.set(update.lineId, update.status);
          }
        }

        for (const [lineId, status] of best.entries()) {
          const line = state.items.find((item) => item.id === lineId);
          if (line) {
            line.lastStatus = status;
            line.lastCheckedAt = check.checkedAt;
          }
        }
      })
      .addCase(refreshTrackedLineChecks.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export const { clearSellerLinesError } = sellerLinesSlice.actions;
export default sellerLinesSlice.reducer;
