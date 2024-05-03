// store.js
import { configureStore } from "@reduxjs/toolkit";
import { networkReducer } from "./slice";

export const store = configureStore({
  reducer: {
    network: networkReducer,
  },
});
