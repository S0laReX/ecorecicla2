import {configureStore} from '@reduxjs/toolkit';
import publications from '../features/publications/store/publicationSlice';
import auth from '../features/auth/store/authSlice';
import collections from '../features/collections/store/collectionSlice';
// Per-provider store prevents cross-request leakage in Next.js SSR.
export const makeStore = ()=>configureStore({reducer:{publications,auth,collections},devTools:false});
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
