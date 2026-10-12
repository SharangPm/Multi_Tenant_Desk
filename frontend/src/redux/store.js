import { configureStore, createSlice } from '@reduxjs/toolkit';
const session = createSlice({
  name: 'session',
  initialState: { user: JSON.parse(localStorage.getItem('user') || 'null') },
  reducers: {
    setUser: (s, a) => {
      s.user = a.payload;
      if (a.payload) localStorage.setItem('user', JSON.stringify(a.payload));
      else localStorage.removeItem('user');
    },
  },
});
export const { setUser } = session.actions;
export const store = configureStore({ reducer: { session: session.reducer } });
