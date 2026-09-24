"use client";

import AuthForm from "./AuthForm";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
};

export default function LoginModal({
  open,
  onClose,
  onLoginSuccess,
}: LoginModalProps) {
  if (!open) {
    return null;
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl transition-all dark:bg-[#121216] dark:border dark:border-gray-800"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* NÚT ĐÓNG */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Đóng"
        >
          ✕
        </button>

        {/* AUTH FORM DÙNG CHUNG */}
        <AuthForm
          isModal={true}
          onSuccess={onLoginSuccess}
          onClose={onClose}
        />
      </div>
    </div>
  );
}