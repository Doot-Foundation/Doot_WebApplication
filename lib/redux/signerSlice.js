import { createSlice } from "@reduxjs/toolkit";

const signerSlice = createSlice({
  name: "Signer",
  initialState: {
    address: "0x00",
  },
  reducers: {
    updateSigner: (state, action) => {
      state.address = action.payload;
    },
  },
});

export const { updateSigner } = signerSlice.actions;
export default signerSlice.reducer;
