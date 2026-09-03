import { StaffLoginForm } from "@/components/auth/StaffLoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50">
      <StaffLoginForm />
    </div>
  );
}
