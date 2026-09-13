import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, GraduationCap, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type Mode = "login" | "register" | "forgot";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
 
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("Login successful!");
      const result = await utils.auth.me.fetch();

      if (result?.role === "admin") {
        setLocation("/admin");
      } else if (result?.role === "teacher") {
        setLocation("/teacher");
      } else {
        setLocation("/portal");
      }
    },
    onError: error => toast.error(error.message),
  });

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: result => {
      toast.success(result.message);

      
    },
    onError: error => toast.error(error.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Account created successfully!");
      const result = await utils.auth.me.fetch();

      if (result?.role === "admin") {
        setLocation("/admin");
      } else if (result?.role === "teacher") {
        setLocation("/teacher");
      } else {
        setLocation("/portal");
      }
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === "admin") {
      setLocation("/admin");
    } else if (user.role === "teacher") {
      setLocation("/teacher");
    } else {
      setLocation("/portal");
    }
  }, [user, loading, setLocation]);

  const isSubmitting =
    loginMutation.isPending ||
    registerMutation.isPending ||
    forgotPasswordMutation.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (mode === "forgot") {
      if (!email.trim()) {
        toast.error("Please enter your email address.");
        return;
      }

      forgotPasswordMutation.mutate({
        email: email.trim(),
      });

      return;
    }

    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        toast.error("Please enter your name.");
        return;
      }

      if (password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }

      registerMutation.mutate({
        name: name.trim(),
        email: email.trim(),
        password,
      });
    } else {
      loginMutation.mutate({
        email: email.trim(),
        password,
      });
    }
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
          <div className="flex rounded-xl bg-black/20 p-1 mb-7">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
                mode === "login"
                  ? "bg-white text-slate-950"
                  : "text-slate-400"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
                mode === "register"
                  ? "bg-white text-slate-950"
                  : "text-slate-400"
              }`}
            >
              Create Account
            </button>
          </div>

          <h1 className="text-2xl font-bold">
            {mode === "login"
              ? "Welcome back"
              : mode === "register"
                ? "Create your account"
                : "Reset your password"}
          </h1>

          <p className="text-sm text-slate-400 mt-1 mb-6">
            {mode === "login"
              ? "Sign in to access your college portal."
              : mode === "register"
                ? "Join the BRCM College learning portal."
                : "Enter your email and we'll generate a password reset link."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full name
                </label>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
            )}

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-indigo-400 hover:text-indigo-300"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold hover:bg-indigo-400 disabled:opacity-50"
            >
              {isSubmitting
                ? "Please wait..."
                : mode === "login"
                  ? "Login"
                  : mode === "register"
                    ? "Create Account"
                    : "Send Reset Link"}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-sm text-slate-400 hover:text-white"
              >
                ← Back to Login
              </button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-indigo-400"
                >
                  Create one
                </button>
              </>
            ) : mode === "register" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-indigo-400"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-indigo-400"
                >
                  Back to Login
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
