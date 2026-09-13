import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminTeachers() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const createTeacher = trpc.admin.createTeacher.useMutation({
    onSuccess: (teacher) => {
      toast.success(`Teacher account created for ${teacher.name}`);
      setName("");
      setEmail("");
      setPassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role !== "admin") {
    setLocation("/portal");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Manage Teachers
            </h1>
            <p className="text-sm text-slate-500">
              Create and manage teacher accounts
            </p>
          </div>

          <button
            onClick={() => setLocation("/admin")}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-100"
          >
            ← Back to Admin
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white border rounded-2xl p-6 max-w-xl">
          <h2 className="text-xl font-semibold text-slate-900">
            Create Teacher Account
          </h2>

          <p className="text-sm text-slate-500 mt-1 mb-6">
            The teacher will use these credentials to sign in.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();

              createTeacher.mutate({
                name,
                email,
                password,
              });
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium mb-2">
                Teacher Name
              </label>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teacher@brcmcollege.edu"
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Temporary Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <button
              type="submit"
              disabled={createTeacher.isPending}
              className="w-full rounded-lg bg-slate-900 text-white px-4 py-3 font-medium disabled:opacity-50"
            >
              {createTeacher.isPending
                ? "Creating Teacher..."
                : "Create Teacher Account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
