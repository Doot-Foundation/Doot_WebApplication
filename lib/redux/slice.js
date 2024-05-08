// features/networkSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  signer: null,
  chainId: null,
  chainName: null,
};

const networkSlice = createSlice({
  name: "network",
  initialState,
  reducers: {
    setSigner: (state, action) => {
      state.signer = action.payload;
    },
    setChainId: (state, action) => {
      state.chainId = action.payload;
    },
    setChainName: (state, action) => {
      state.chainName = action.payload;
    },
    // setGraphData: (state, action) => {
    //   state.graphData = action.payload;
    // },
    // setMinPrice: (state, action) => {
    //   state.minPrice = action.payload;
    // },
    // setMaxPrice: (state, action) => {
    //   state.maxPrice = action.payload;
    // },
    // setPercentage: (state, action) => {
    //   state.percentage = action.payload;
    // },
  },
});

export const { setSigner, setChainId, setChainName } = networkSlice.actions;
export const networkReducer = networkSlice.reducer;
