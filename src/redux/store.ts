import { Action, ThunkAction, configureStore } from '@reduxjs/toolkit';
import { baseApi } from './features/baseApi';
import authReducer from './services/authSlice';
import modalSlice from './services/modal.Slice';
import warehouseReducer from './features/warehouse/warehouseSlice'; // Add warehouse reducer
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storageModule from 'redux-persist/lib/storage'; // Renamed import
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

// Create noop storage for SSR if needed
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Use a different variable name
const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage();

const authPersistConfig = {
  key: 'auth',
  storage, // This uses the storage variable above
  whitelist: ['user', 'token'] // Only persist these fields
};

const warehousePersistConfig = {
  key: 'warehouse',
  storage, // This uses the storage variable above
  whitelist: ['transfers', 'warehouseStock'] // Cache some data
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedWarehouseReducer = persistReducer(warehousePersistConfig, warehouseReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    warehouse: persistedWarehouseReducer, // Add warehouse reducer
    modal: modalSlice,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export const persistor = persistStore(store);