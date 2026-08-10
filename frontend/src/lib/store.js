import { configureStore, createSlice } from "@reduxjs/toolkit";

const authInitialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

const cartInitialState = {
  items: [],
  cart: null,
  loading: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState: cartInitialState,
  reducers: {
    setCart: (state, action) => {
      state.items = action.payload.items || [];
      state.cart = action.payload.cart;
    },
    clearCart: (state) => {
      state.items = [];
      state.cart = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

const wishlistInitialState = {
  items: [],
  loading: false,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: wishlistInitialState,
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { loginSuccess, logout, setLoading: setAuthLoading, setUser } = authSlice.actions;
export const { setCart, clearCart, setLoading: setCartLoading } = cartSlice.actions;
export const { setItems: setWishlistItems, setLoading: setWishlistLoading } = wishlistSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    wishlist: wishlistSlice.reducer,
  },
});

export default store;