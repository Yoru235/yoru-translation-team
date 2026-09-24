import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">
          <AuthForm isModal={false} />
        </div>
      </div>
    </main>
  );
}