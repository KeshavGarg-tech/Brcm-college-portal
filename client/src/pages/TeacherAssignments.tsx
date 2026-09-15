import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock3,
  X,
  Send,
  Eye,
  EyeOff,
  Paperclip,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDeadlineState(value: string | Date | null | undefined) {
  if (!value) {
    return {
      label: "No deadline",
      className: "bg-slate-100 text-slate-600",
    };
  }

  const date = new Date(value);
  const now = new Date();

  if (date < now) {
    return {
      label: "Past due",
      className: "bg-red-50 text-red-700",
    };
  }

  const hours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hours <= 24) {
    return {
      label: "Due soon",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Upcoming",
    className: "bg-green-50 text-green-700",
  };
}

export default function TeacherAssignments() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] =
    useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [attachment, setAttachment] = useState<File | null>(null);

  const assignmentsQuery = trpc.portal.teacherAssignments.useQuery(undefined, {
    enabled:
      !!user && (user.role === "teacher" || user.role === "admin"),
  });

  const classesQuery = trpc.portal.teacherClasses.useQuery(undefined, {
    enabled:
      !!user && (user.role === "teacher" || user.role === "admin"),
  });

  const submissionsQuery = trpc.portal.assignmentSubmissions.useQuery(
    {
      assignmentId: selectedAssignmentId ?? 0,
    },
    {
      enabled: selectedAssignmentId !== null,
    },
  );

  const createMutation = trpc.portal.createAssignment.useMutation({
    onSuccess: async () => {
      await assignmentsQuery.refetch();

      setShowCreate(false);
      setTitle("");
      setDescription("");
      setClassId("");
      setDueDate("");
      setIsPublished(true);
      setAttachment(null);
    },
  });

  const publishMutation = trpc.portal.publishAssignment.useMutation({
    onSuccess: async () => {
      await assignmentsQuery.refetch();
    },
  });

  const deleteMutation = trpc.portal.deleteAssignment.useMutation({
    onSuccess: async () => {
      await assignmentsQuery.refetch();

      if (selectedAssignmentId !== null) {
        setSelectedAssignmentId(null);
      }
    },
  });

  const assignmentRows = assignmentsQuery.data ?? [];
  const assignments = assignmentRows.map((row) => row.assignments);
  const classes = classesQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];

  const selectedAssignment = assignments.find(
    (assignment) => assignment.id === selectedAssignmentId,
  );

  const stats = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter(
      (assignment) => assignment.isPublished,
    ).length;

    const upcoming = assignments.filter((assignment) => {
      if (!assignment.dueDate) return false;
      return new Date(assignment.dueDate) > new Date();
    }).length;

    const pastDue = assignments.filter((assignment) => {
      if (!assignment.dueDate) return false;
      return new Date(assignment.dueDate) < new Date();
    }).length;

    return {
      total,
      published,
      upcoming,
      pastDue,
    };
  }, [assignments]);

  async function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result ?? "");
        resolve(result.split(",")[1] ?? "");
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function createAssignment() {
    if (!title.trim()) {
      alert("Please enter an assignment title.");
      return;
    }

    if (!classId) {
      alert("Please select a class.");
      return;
    }

    if (!dueDate) {
      alert("Please select a deadline.");
      return;
    }

    let fileData: string | undefined;

    if (attachment) {
      fileData = await fileToBase64(attachment);
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      classId: Number(classId),
      dueDate: dueDate,
      isPublished,
      attachmentName: attachment?.name,
      
      
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Loading...
      </div>
    );
  }

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/teacher")}
              className="p-2 rounded-lg hover:bg-slate-100 transition"
              title="Back to Teacher Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Assignments
              </h1>

              <p className="text-sm text-slate-500">
                Create, publish and manage assignments for your classes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Total assignments
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {stats.total}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Published
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {stats.published}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock3 className="w-5 h-5" />
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Upcoming
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {stats.upcoming}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Past due
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {stats.pastDue}
            </p>
          </div>
        </div>

        {/* Assignment list */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-semibold text-slate-900">
              Your Assignments
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Assignments created for your classes.
            </p>
          </div>

          {assignmentsQuery.isLoading ? (
            <div className="p-10 text-center text-slate-500">
              Loading assignments...
            </div>
          ) : assignmentsQuery.isError ? (
            <div className="p-8">
              <p className="font-semibold text-red-700">
                Could not load assignments.
              </p>

              <p className="text-sm text-red-500 mt-2">
                {assignmentsQuery.error.message}
              </p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList className="mx-auto w-12 h-12 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No assignments yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create your first assignment to get started.
              </p>

              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Assignment
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {assignments.map((assignment) => {
                const deadline = getDeadlineState(assignment.dueDate);

                return (
                  <div
                    key={assignment.id}
                    className="p-6 hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {assignment.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${deadline.className}`}
                          >
                            {deadline.label}
                          </span>

                          {assignment.isPublished ? (
                            <span className="rounded-full bg-green-50 text-green-700 px-2.5 py-1 text-xs font-semibold">
                              Published
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-xs font-semibold">
                              Draft
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                          {assignment.description || "No description provided."}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4" />
                            {formatDate(assignment.dueDate)}
                          </span>

                          {assignment.attachmentName && (
                            <span className="inline-flex items-center gap-1.5">
                              <Paperclip className="w-4 h-4" />
                              {assignment.attachmentName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAssignmentId(
                              selectedAssignmentId === assignment.id
                                ? null
                                : assignment.id,
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                        >
                          <Users className="w-4 h-4" />
                          Submissions
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            publishMutation.mutate({
                              assignmentId: assignment.id,
                              isPublished: !assignment.isPublished,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                        >
                          {assignment.isPublished ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Publish
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Delete this assignment? This cannot be undone.",
                              )
                            ) {
                              deleteMutation.mutate({
                                assignmentId: assignment.id,
                              });
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {selectedAssignmentId === assignment.id && (
                      <div className="mt-5 rounded-2xl bg-slate-50 border p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              Submission Overview
                            </h4>

                            <p className="text-xs text-slate-500 mt-1">
                              Review student submissions for this assignment.
                            </p>
                          </div>

                          <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold">
                            {submissions.length} submission
                            {submissions.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        {submissionsQuery.isLoading ? (
                          <p className="mt-5 text-sm text-slate-500">
                            Loading submissions...
                          </p>
                        ) : submissions.length === 0 ? (
                          <div className="mt-5 rounded-xl bg-white border p-5 text-center">
                            <Users className="mx-auto w-7 h-7 text-slate-300" />
                            <p className="mt-2 text-sm font-medium text-slate-700">
                              No submissions yet
                            </p>
                          </div>
                        ) : (
                          <div className="mt-5 space-y-3">
                            {submissions.map((submission) => (
                              <div
                                key={submission.id}
                                className="bg-white border rounded-xl p-4 flex items-center justify-between gap-4"
                              >
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {submission.studentName}
                                  </p>

                                  <p className="text-xs text-slate-500 mt-1">
                                    Submitted{" "}
                                    {formatDate(submission.submittedAt)}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span
                                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      submission.status === "returned"
                                        ? "bg-red-50 text-red-700"
                                        : "bg-green-50 text-green-700"
                                    }`}
                                  >
                                    {submission.status === "returned"
                                      ? "Late"
                                      : "Submitted"}
                                  </span>

                                  {submission.grade !== null &&
                                    submission.grade !== undefined && (
                                      <p className="text-sm font-bold text-slate-900 mt-1">
                                        Grade: {submission.grade}
                                      </p>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create assignment modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Assignment
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Give your students a clear task and deadline.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Assignment title
                </label>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Unit 3 Problem Set"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Class
                </label>

                <select
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class</option>

                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {"subjectName" in item && item.subjectName
                        ? ` — ${item.subjectName}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  placeholder="Explain what students need to complete..."
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Deadline
                </label>

                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Attachment
                </label>

                <input
                  type="file"
                  onChange={(event) =>
                    setAttachment(event.target.files?.[0] ?? null)
                  }
                  className="w-full rounded-xl border p-3 text-sm"
                />

                {attachment && (
                  <p className="mt-2 text-xs text-slate-500">
                    Selected: {attachment.name}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(event) => setIsPublished(event.target.checked)}
                  className="w-4 h-4"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Publish immediately
                  </p>

                  <p className="text-xs text-slate-500">
                    Students will see the assignment immediately.
                  </p>
                </div>
              </label>

              {createMutation.isError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">
                    Could not create assignment.
                  </p>

                  <p className="text-xs text-red-600 mt-1">
                    {createMutation.error.message}
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={createAssignment}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />

                {createMutation.isPending
                  ? "Creating..."
                  : "Create Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
