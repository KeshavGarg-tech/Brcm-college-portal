import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, GraduationCap, Lock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ResetPassword() {
  const [, setLocation] = useLocation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: result => {
      toast.success(result.message);
      setTimeout(() => setLocation("/login"), 1200);
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error("Invalid password reset link.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    resetPasswordMutation.mutate({
      token,
      password,
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-3"
          >
            <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center">
              <GraduationCap className="h-7 w-7" />
            </div>

            <div className="text-left">
              <div className="font-bold text-xl">BRCM College</div>
              <div className="text-sm text-slate-400">Student Portal</div>
            </div>
          </button>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-7 shadow-2xl">
          <h1 className="text-2xl font-bold">
            Create a new password
          </h1>

          <p className="text-sm text-slate-400 mt-1 mb-6">
            Choose a new password for your BRCM College account.
          </p>

          {!token ? (
            <div className="space-y-4">
              <p className="text-sm text-red-400">
                This password reset link is invalid or incomplete.
              </p>

              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold hover:bg-indigo-400"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-12 outline-none focus:border-indigo-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm new password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-12 outline-none focus:border-indigo-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(v => !v)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Your password must contain at least 8 characters.
              </p>

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold hover:bg-indigo-400 disabled:opacity-50"
              >
                {resetPasswordMutation.isPending
                  ? "Updating password..."
                  : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="w-full text-sm text-slate-400 hover:text-white"
              >
                ← Back to Login
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
