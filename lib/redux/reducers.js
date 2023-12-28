import { combineReducers } from "@reduxjs/toolkit";
import signerSlice from "./signerSlice";
import chainSlice from "./chainSlice";

export const rootReducer = combineReducers({
  signer: signerSlice,
  chain: chainSlice,
});
