import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminClasses() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [description, setDescription] = useState("");
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectDescription, setNewSubjectDescription] = useState("");


  const subjectsQuery = trpc.admin.listSubjects.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const classesQuery = trpc.admin.listClasses.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const teachersQuery = trpc.admin.listTeachers.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

const createSubjectMutation = trpc.admin.createSubject.useMutation({
  onSuccess: (result) => {
    const createdSubject = Array.isArray(result) ? result[0] : result;

    if (createdSubject) {
      setSubjectId(String(createdSubject.id));
    }

    setNewSubjectName("");
    setNewSubjectCode("");
    setNewSubjectDescription("");
    setShowNewSubject(false);
    subjectsQuery.refetch();

    toast.success("Subject created and selected");
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

  const createMutation = trpc.admin.createClass.useMutation({
    onSuccess: () => {
      toast.success("Class created successfully");
      setName("");
      setSubjectId("");
      setTeacherId("");
      setAcademicYear("2026-27");
      setDescription("");
      classesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const subjects = subjectsQuery.data ?? [];
  const classes = classesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Class name is required");
      return;
    }

    if (!subjectId) {
      toast.error("Please select a subject");
      return;
    }

    if (!teacherId) {
      toast.error("Please select a teacher");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      subjectId: Number(subjectId),
      teacherId: Number(teacherId),
      academicYear: academicYear.trim(),
      description: description.trim(),
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Class Management
            </h1>
            <p className="text-sm text-slate-500">
              Create and manage college classes
            </p>
          </div>

          <button
            onClick={() => setLocation("/admin")}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Back to Admin
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-5">
              Create New Class
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Class Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="B.Tech CSE - 1st Year"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
  <label className="block text-sm font-medium mb-1">
    Subject
  </label>

  <div className="flex gap-2">
    <select
      value={subjectId}
      onChange={(e) => setSubjectId(e.target.value)}
      className="flex-1 border rounded-lg px-3 py-2 bg-white"
    >
      <option value="">Select subject</option>

      {subjects.map((subject) => (
        <option key={subject.id} value={subject.id}>
          {subject.code} - {subject.name}
        </option>
      ))}
    </select>

    <button
      type="button"
      onClick={() => setShowNewSubject((value) => !value)}
      className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
    >
      {showNewSubject ? "Cancel" : "+ New Subject"}
    </button>
  </div>

  {showNewSubject && (
    <div className="mt-3 rounded-lg border bg-slate-50 p-4">
      <h3 className="mb-3 text-sm font-semibold">
        Create New Subject
      </h3>

      <div className="space-y-3">
        <input
          type="text"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          placeholder="Subject Name"
          className="w-full border rounded-lg px-3 py-2 bg-white"
        />

        <input
          type="text"
          value={newSubjectCode}
          onChange={(e) => setNewSubjectCode(e.target.value)}
          placeholder="Subject Code e.g. CSE201"
          className="w-full border rounded-lg px-3 py-2 bg-white"
        />

        <textarea
          value={newSubjectDescription}
          onChange={(e) => setNewSubjectDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full border rounded-lg px-3 py-2 bg-white"
        />

        <button
          type="button"
          disabled={createSubjectMutation.isPending}
          onClick={() => {
            if (!newSubjectName.trim() || !newSubjectCode.trim()) {
              toast.error("Subject name and code are required");
              return;
            }

            createSubjectMutation.mutate({
              name: newSubjectName.trim(),
              code: newSubjectCode.trim(),
              description: newSubjectDescription.trim(),
            });
          }}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {createSubjectMutation.isPending
            ? "Creating..."
            : "Create Subject & Use"}
        </button>
      </div>
    </div>
  )}
</div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Teacher
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Academic Year
                </label>
                <input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026-27"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Class description..."
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full rounded-lg bg-slate-900 text-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create Class"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold">
                    Existing Classes
                  </h2>
                  <p className="text-sm text-slate-500">
                    {classes.length} class{classes.length === 1 ? "" : "es"}
                  </p>
                </div>
              </div>

              {classes.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No classes created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {classItem.name}
                          </h3>

                          <p className="text-sm text-slate-600 mt-1">
                            {classItem.subjectCode} -{" "}
                            {classItem.subjectName}
                          </p>

                          <p className="text-sm text-slate-500 mt-1">
                            Teacher: {classItem.teacherName}
                          </p>

                          {classItem.academicYear && (
                            <p className="text-xs text-slate-400 mt-2">
                              Academic Year: {classItem.academicYear}
                            </p>
                          )}
                        </div>
                      </div>

                      {classItem.description && (
                        <p className="text-sm text-slate-500 mt-3">
                          {classItem.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
