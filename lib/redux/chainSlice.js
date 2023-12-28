import { createSlice } from "@reduxjs/toolkit";

const chainSlice = createSlice({
  name: "Chain",
  initialState: {
    chainId: 0,
    chainName: "",
  },
  reducers: {
    updateChain: (state, action) => {
      state.chainId = action.payload.chainId;
      state.chainName = action.payload.chainName;
    },
  },
});

export const { updateChain } = chainSlice.actions;

export default chainSlice.reducer;
