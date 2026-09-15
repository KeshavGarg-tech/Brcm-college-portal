import { useLocation } from "wouter";
import { ArrowLeft, BookOpen, Users, GraduationCap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function TeacherClasses() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  const classesQuery = trpc.portal.teacherClasses.useQuery(undefined, {
    enabled: !!user && (user.role === "teacher" || user.role === "admin"),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    setLocation("/login");
    return null;
  }

  const classes = classesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => setLocation("/teacher")}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
            title="Back to Teacher Portal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              My Classes
            </h1>
            <p className="text-sm text-slate-500">
              View the classes and subjects you teach
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {classesQuery.isLoading ? (
          <div className="bg-white border rounded-2xl p-8 text-center">
            <p className="text-slate-500">Loading your classes...</p>
          </div>
        ) : classesQuery.isError ? (
          <div className="bg-white border border-red-200 rounded-2xl p-8">
            <p className="font-semibold text-red-700">
              Could not load your classes.
            </p>
            <p className="text-sm text-red-500 mt-2">
              {classesQuery.error.message}
            </p>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center">
            <BookOpen className="mx-auto w-10 h-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No classes assigned yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Classes assigned to your teacher account will appear here.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Your Classes
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {classes.length} class{classes.length === 1 ? "" : "es"}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <GraduationCap className="w-4 h-4" />
                Teaching
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classes.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>

                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Class
                    </div>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {item.name}
                  </h3>

                  {"subjectName" in item && item.subjectName ? (
                    <p className="mt-1 text-sm text-blue-600 font-medium">
                      {item.subjectName}
                    </p>
                  ) : null}

                  {"subjectCode" in item && item.subjectCode ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {item.subjectCode}
                    </p>
                  ) : null}

                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    Students enrolled in this class
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
