import { create } from "zustand";

const USER_KEY = "coldchain_current_user";

interface UserState {
  userName: string;
  shift: string;
  shiftTime: string;
  setUser: (userName: string, shift: string, shiftTime: string) => void;
  initUser: () => void;
}

function loadUser(): { userName: string; shift: string; shiftTime: string } {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load user:", e);
  }
  return {
    userName: "刘值班",
    shift: "早班",
    shiftTime: "08:00-16:00",
  };
}

function saveUser(userName: string, shift: string, shiftTime: string): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ userName, shift, shiftTime }));
  } catch (e) {
    console.error("Failed to save user:", e);
  }
}

export const useUserStore = create<UserState>((set) => ({
  ...loadUser(),

  setUser: (userName, shift, shiftTime) => {
    saveUser(userName, shift, shiftTime);
    set({ userName, shift, shiftTime });
  },

  initUser: () => {
    set(loadUser());
  },
}));
