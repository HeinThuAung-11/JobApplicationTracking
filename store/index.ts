import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import jobsReducer from "./jobsSlice";

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

