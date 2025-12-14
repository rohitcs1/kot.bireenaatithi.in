import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
    { id: 1, name: 'Paneer Tikka', price: 250, category: 'Starters', isVeg: true, available: true },
    { id: 2, name: 'Chicken Biryani', price: 350, category: 'Main', isVeg: false, available: true },
    { id: 3, name: 'Butter Chicken', price: 380, category: 'Main', isVeg: false, available: true },
    { id: 4, name: 'Mango Lassi', price: 120, category: 'Drinks', isVeg: true, available: true },
    { id: 5, name: 'Gulab Jamun', price: 80, category: 'Desserts', isVeg: true, available: true },
  ],
  loading: false,
  error: null,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenuItems: (state, action) => {
      state.items = action.payload;
    },
    addMenuItem: (state, action) => {
      state.items.push(action.payload);
    },
    updateMenuItem: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteMenuItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    toggleItemAvailability: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.available = !item.available;
      }
    },
  },
});

export const { setMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability } = menuSlice.actions;
export default menuSlice.reducer;

