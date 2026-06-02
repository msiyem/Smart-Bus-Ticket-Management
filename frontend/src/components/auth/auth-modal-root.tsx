// components/auth/auth-modal-root.tsx
"use client";

import LoginModal from "./login-modal";
import RegisterModal from "./register-modal";

import { useAuthModalStore } from "@/store/auth-modal-store";

export default function AuthModalRoot() {
  const modal = useAuthModalStore(
    (state) => state.modal
  );

  const closeModal = useAuthModalStore(
    (state) => state.closeModal
  );

  const openLogin = useAuthModalStore(
    (state) => state.openLogin
  );

  const openRegister = useAuthModalStore(
    (state) => state.openRegister
  );

  return (
    <>
      <LoginModal
        open={modal === "login"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        switchToRegister={openRegister}
      />

      <RegisterModal
        open={modal === "register"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        switchToLogin={openLogin}
      />
    </>
  );
}