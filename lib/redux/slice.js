import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  signer: null,
  chainName: null,
};

const networkSlice = createSlice({
  name: "network",
  initialState,
  reducers: {
    setSigner: (state, action) => {
      state.signer = action.payload;
    },
    setChainName: (state, action) => {
      state.chainName = action.payload;
    },
  },
});

export const { setSigner, setChainName } = networkSlice.actions;
export const networkReducer = networkSlice.reducer;
