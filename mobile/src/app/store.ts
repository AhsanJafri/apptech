import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import domainsReducer from '@/features/domains/domainsSlice';
import checksReducer from '@/features/checks/checksSlice';
import sellerLinesReducer from '@/features/sellerLines/sellerLinesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    domains: domainsReducer,
    checks: checksReducer,
    sellerLines: sellerLinesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
