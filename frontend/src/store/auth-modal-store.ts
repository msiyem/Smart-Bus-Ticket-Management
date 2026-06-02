import { create } from "zustand";

type ModalType = "login" | "register" | "forgot-password" | null;

interface AuthModalState {
  modal: ModalType;
  openLogin: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  closeModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  modal: null,
  openLogin: () => set({ modal: "login" }),
  openRegister: () => set({ modal: "register" }),
  openForgotPassword: () => set({ modal: "forgot-password" }),
  closeModal: () => set({ modal: null }),
}));
