import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Edit3, Plus, Trash2, ArrowLeft, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function AdminSubjects() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  const utils = trpc.useUtils();

  const subjectsQuery = trpc.admin.listSubjects.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const createMutation = trpc.admin.createSubject.useMutation({
    onSuccess: async () => {
      toast.success("Subject created successfully");
      await utils.admin.listSubjects.invalidate();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.admin.updateSubject.useMutation({
    onSuccess: async () => {
      toast.success("Subject updated successfully");
      await utils.admin.listSubjects.invalidate();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.admin.deleteSubject.useMutation({
    onSuccess: async () => {
      toast.success("Subject deleted successfully");
      await utils.admin.listSubjects.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setCode("");
    setDescription("");
  }

  function startEdit(subject: {
    id: number;
    name: string;
    code: string;
    description: string | null;
  }) {
    setEditingId(subject.id);
    setName(subject.name);
    setCode(subject.code);
    setDescription(subject.description ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || !code.trim()) {
      toast.error("Subject name and code are required");
      return;
    }

    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        name,
        code,
        description,
      });
    } else {
      createMutation.mutate({
        name,
        code,
        description,
      });
    }
  }

  function handleDelete(id: number, subjectName: string) {
    const confirmed = window.confirm(
      `Delete "${subjectName}"?\n\nThis should only be done if the subject is not being used by any classes.`,
    );

    if (!confirmed) return;

    deleteMutation.mutate({ id });
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (user.role !== "admin") {
    return null;
  }

  const subjects = subjectsQuery.data ?? [];
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/admin")}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Subject Management
              </h1>
              <p className="text-sm text-slate-500">
                Manage college subjects
              </p>
            </div>
          </div>

          <BookOpen className="text-blue-600" size={25} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Form */}
        <section className="bg-white border rounded-2xl p-4 sm:p-6 mb-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId !== null ? "Edit Subject" : "Add Subject"}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {editingId !== null
                  ? "Update the subject information."
                  : "Create a new subject for the college."}
              </p>
            </div>

            {editingId === null && (
              <div className="shrink-0 p-2 rounded-lg bg-blue-50">
                <Plus className="text-blue-600" size={20} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Programming Fundamentals"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject Code
                </label>

                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CSE101"
                  className="w-full rounded-xl border px-4 py-3 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional subject description"
                rows={3}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {editingId !== null ? (
                  <Edit3 size={18} />
                ) : (
                  <Plus size={18} />
                )}

                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Subject"
                    : "Add Subject"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 rounded-xl border hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Subjects */}
        <section className="bg-white border rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-semibold text-slate-900">
              All Subjects
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {subjects.length} subject{subjects.length === 1 ? "" : "s"}
            </p>
          </div>

          {subjectsQuery.isLoading ? (
            <div className="p-6 text-slate-500">
              Loading subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No subjects have been created yet.
            </div>
          ) : (
            <div className="divide-y">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="p-6 flex items-center justify-between gap-5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                        {subject.code}
                      </span>

                      <h3 className="font-semibold text-slate-900">
                        {subject.name}
                      </h3>
                    </div>

                    {subject.description && (
                      <p className="text-sm text-slate-500 mt-2">
                        {subject.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(subject)}
                      className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-600"
                      title="Edit subject"
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(subject.id, subject.name)
                      }
                      disabled={deleteMutation.isPending}
                      className="p-2.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                      title="Delete subject"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
