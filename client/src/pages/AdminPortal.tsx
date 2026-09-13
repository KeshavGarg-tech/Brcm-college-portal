import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminPortal() {
  const [, setLocation] = useLocation();
  const { user, loading, logout } = useAuth();

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              BRCM College
            </h1>
            <p className="text-sm text-slate-500">
              Administrator Portal
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>

            <button
              onClick={async () => {
                await logout();
                setLocation("/");
              }}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Admin Dashboard
        </h2>

        <p className="mt-2 text-slate-600">
          Manage teachers, students, classes, subjects and announcements.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold text-lg">Teachers</h3>
            <p className="text-sm text-slate-500 mt-2">
              Create and manage teacher accounts.
            </p>
            <button
              onClick={() => setLocation("/admin/teachers")}
              className="mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm"
            >
              Manage Teachers
            </button>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold text-lg">Students</h3>
            <p className="text-sm text-slate-500 mt-2">
              Manage student accounts and enrollment.
            </p>
            <button
              onClick={() => setLocation("/admin/enrollments")}
              className="mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm"
            >
              Manage Enrollment
            </button>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold text-lg">Subjects & Classes</h3>
            <p className="text-sm text-slate-500 mt-2">
              Create subjects and assign teachers.
            </p>
            <button
              onClick={() => setLocation("/admin/classes")}
              className="mt-4 rounded-lg border px-4 py-2 text-sm"
            >
              Manage Classes
            </button>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold text-lg">Announcements</h3>
            <p className="text-sm text-slate-500 mt-2">
              Publish announcements to students and teachers.
            </p>
            <button className="mt-4 rounded-lg border px-4 py-2 text-sm">
              Manage Announcements
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
