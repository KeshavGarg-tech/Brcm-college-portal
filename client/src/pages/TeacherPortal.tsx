import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Megaphone,
  Users,
  Upload,
  LogOut,
  GraduationCap,
  Download,
  ExternalLink,
  Trash2,
  Loader2,
  Paperclip,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function TeacherPortal() {
  const [, setLocation] = useLocation();
  const { user, loading, logout } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const [answerFiles, setAnswerFiles] = useState<Record<number, File | null>>({});
  const answerFileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [materialSearch, setMaterialSearch] = useState("");
  const [materialClassFilter, setMaterialClassFilter] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const classesQuery = trpc.portal.teacherClasses.useQuery(undefined, {
    enabled: !!user && user.role === "teacher",
  });

  const materialsQuery = trpc.portal.teacherMaterials.useQuery(undefined, {
    enabled: !!user && user.role === "teacher",
  });
const teacherQuestionsQuery = trpc.portal.teacherQuestions.useQuery(undefined, {
  enabled: !!user && user.role === "teacher",
});
const answerQuestionMutation = trpc.portal.answerQuestion.useMutation({
  onSuccess: async () => {
    await utils.portal.teacherQuestions.invalidate();
    alert("Answer sent to student.");
  },
  onError: (error) => {
    alert(error.message);
  },
});
  const uploadMutation = trpc.portal.uploadMaterial.useMutation({
    onSuccess: async () => {
      await utils.portal.teacherMaterials.invalidate();

      setTitle("");
      setDescription("");
      setSelectedClass("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      alert("Material uploaded successfully!");
    },
    onError: (error) => {
      alert(error.message);
    },
    onSettled: () => {
      setUploadProgress(false);
    },
  });

  const deleteMaterialMutation = trpc.portal.deleteMaterial.useMutation({
    onSuccess: async () => {
      await utils.portal.teacherMaterials.invalidate();
      alert("Material deleted successfully.");
    },
    onError: error => {
      alert(error.message);
    },
  });

  const teacherClasses = classesQuery.data ?? [];
  const materials = materialsQuery.data ?? [];

  const filteredMaterials = materials.filter((material) => {
    const search = materialSearch.trim().toLowerCase();

    const matchesSearch =
      !search ||
      material.title.toLowerCase().includes(search) ||
      material.fileName.toLowerCase().includes(search);

    const matchesClass =
      !materialClassFilter ||
      String(material.classId) === materialClassFilter;

    return matchesSearch && matchesClass;
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading teacher portal...</p>
      </div>
    );
  }

  if (user.role !== "teacher") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("File must be smaller than 50 MB.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    if (!title) {
      const extensionIndex = file.name.lastIndexOf(".");
      const cleanName =
        extensionIndex > 0
          ? file.name.slice(0, extensionIndex)
          : file.name;

      setTitle(cleanName);
    }
  };

  const handleUpload = async () => {
    if (!selectedClass) {
      alert("Please select a class.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a material title.");
      return;
    }

    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    try {
      setUploadProgress(true);

      const arrayBuffer = await selectedFile.arrayBuffer();

      const bytes = new Uint8Array(arrayBuffer);

      let binary = "";
      const chunkSize = 0x8000;

      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(
          i,
          Math.min(i + chunkSize, bytes.length),
        );

        binary += Array.from(chunk, byte => String.fromCharCode(byte)).join("");
      }

      const fileData = btoa(binary);

      await uploadMutation.mutateAsync({
        classId: Number(selectedClass),
        title: title.trim(),
        description: description.trim() || undefined,
        fileName: selectedFile.name,
        mimeType:
          selectedFile.type || "application/octet-stream",
        fileSize: selectedFile.size,
        fileData,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadProgress(false);
      alert("Upload failed. Please try again.");
    }
  };

  const handleDeleteMaterial = async (
    materialId: number,
    title: string,
  ) => {
    const confirmed = window.confirm(
      `Delete "${title}"? This will permanently remove the material file.`
    );

    if (!confirmed) return;

    await deleteMaterialMutation.mutateAsync({
      materialId,
    });
  };

  const openMaterial = (materialId: number) => {
  window.open(
    `/api/materials/${materialId}/view`,
    "_blank",
    "noopener,noreferrer"
  );
};

  const sendTeacherAnswer = async (
    questionId: number,
    response: string,
  ) => {
    const trimmed = response.trim();
    const file = answerFiles[questionId] ?? null;

    if (!trimmed && !file) {
      alert("Please write an answer or attach a file.");
      return;
    }

    let fileData: string | undefined;

    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("File must be smaller than 50 MB.");
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let binary = "";
      const chunkSize = 0x8000;

      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(
          i,
          Math.min(i + chunkSize, bytes.length),
        );

        binary += Array.from(
          chunk,
          (byte) => String.fromCharCode(byte),
        ).join("");
      }

      fileData = btoa(binary);
    }

    answerQuestionMutation.mutate({
      questionId,
      teacherResponse: trimmed || "Please see the attached file.",
      fileName: file?.name,
      mimeType: file?.type || undefined,
      fileSize: file?.size,
      fileData,
    });
  };

  const handleAnswerFileChange = (
    questionId: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;

    if (file && file.size > 50 * 1024 * 1024) {
      alert("File must be smaller than 50 MB.");
      event.target.value = "";
      return;
    }

    setAnswerFiles((current) => ({
      ...current,
      [questionId]: file,
    }));
  };

  const downloadMaterial = (
    materialId: number,
    fileName: string,
  ) => {
    const link = document.createElement("a");
    link.href = `/api/materials/${materialId}/download`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <GraduationCap size={24} />
            </div>

            <div>
              <h1 className="font-bold text-xl text-slate-900">
                BRCM College
              </h1>
              <p className="text-xs text-slate-500">
                Teacher Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-slate-900">
                {user.name}
              </p>
              <p className="text-xs text-slate-500">
                {user.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-slate-100 transition"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Welcome, {user.name}
          </h2>

          <p className="text-slate-500 mt-1">
            Manage your classes, materials, assignments and students.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            icon={<BookOpen size={22} />}
            title="My Classes"
            value={String(teacherClasses.length)}
          />

          <StatCard
            icon={<Users size={22} />}
            title="Students"
            value="0"
          />

          <StatCard
            icon={<ClipboardList size={22} />}
            title="Assignments"
            value="0"
          />

          <StatCard
            icon={<FileText size={22} />}
            title="Materials"
            value={String(materials.length)}
          />
        </div>

        {/* Classes */}
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          My Classes
        </h3>

        {classesQuery.isLoading ? (
          <div className="bg-white border rounded-2xl p-6 mb-8">
            <p className="text-slate-500">
              Loading your classes...
            </p>
          </div>
        ) : teacherClasses.length === 0 ? (
          <div className="bg-white border rounded-2xl p-6 mb-8">
            <p className="font-medium text-slate-900">
              No classes assigned yet
            </p>

            <p className="text-sm text-slate-500 mt-1">
              An administrator can assign classes to you from
              the Admin Portal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {teacherClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-white border rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      {classItem.subjectCode}
                    </p>

                    <h4 className="text-xl font-semibold text-slate-900 mt-1">
                      {classItem.name}
                    </h4>

                    <p className="text-slate-600 mt-2">
                      {classItem.subjectName}
                    </p>
                  </div>

                  <BookOpen
                    className="text-blue-600"
                    size={24}
                  />
                </div>

                <div className="mt-5 pt-4 border-t">
                  <p className="text-sm text-slate-500">
                    Academic Year
                  </p>

                  <p className="font-medium text-slate-900">
                    {classItem.academicYear ??
                      "Not specified"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Material */}
        <section className="bg-white border rounded-2xl p-6 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Upload size={22} />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Upload Study Material
              </h3>

              <p className="text-sm text-slate-500">
                Upload notes, PDFs, presentations and other
                learning resources.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Class
              </label>

              <select
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
                className="w-full border rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  Select a class
                </option>

                {teacherClasses.map((classItem) => (
                  <option
                    key={classItem.id}
                    value={classItem.id}
                  >
                    {classItem.subjectCode} —{" "}
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Material Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Unit 1 Notes"
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe this material..."
                rows={3}
                className="w-full border rounded-xl px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* File */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                File
              </label>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="block w-full border rounded-xl px-4 py-3 bg-white"
              />

              <p className="text-xs text-slate-500 mt-2">
                Maximum file size: 50 MB
              </p>

              {selectedFile && (
                <div className="mt-3 p-4 rounded-xl bg-slate-50 border flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {selectedFile.name}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>

                  <FileText
                    size={22}
                    className="text-blue-600"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploadProgress}
            className="mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {uploadProgress ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload Material
              </>
            )}
          </button>
        </section>

        {/* Uploaded Materials */}
        <section>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                My Uploaded Materials
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Resources you've uploaded for your classes.
              </p>
            </div>
 
                    {/* Student Questions */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Student Questions
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Questions sent to you by your students.
              </p>
            </div>

            {teacherQuestionsQuery.data &&
              teacherQuestionsQuery.data.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                  {teacherQuestionsQuery.data.length} question
                  {teacherQuestionsQuery.data.length === 1 ? "" : "s"}
                </span>
              )}
          </div>

          {teacherQuestionsQuery.isLoading ? (
            <div className="bg-white border rounded-2xl p-6">
              <p className="text-slate-500">
                Loading student questions...
              </p>
            </div>
          ) : teacherQuestionsQuery.isError ? (
            <div className="bg-white border border-red-200 rounded-2xl p-6">
              <p className="font-medium text-red-700">
                Could not load student questions.
              </p>
              <p className="text-sm text-red-500 mt-1">
                {teacherQuestionsQuery.error.message}
              </p>
            </div>
          ) : teacherQuestionsQuery.data?.length === 0 ? (
            <div className="bg-white border rounded-2xl p-8 text-center">
              <ClipboardList
                size={36}
                className="mx-auto text-slate-300"
              />

              <p className="font-medium text-slate-900 mt-3">
                No student questions yet
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Questions from your students will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {teacherQuestionsQuery.data?.map((question) => (
                <div
                  key={question.id}
                  className="bg-white border rounded-2xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        {question.subjectCode}
                      </p>

                      <h4 className="text-lg font-semibold text-slate-900 mt-1">
                        {question.subjectName}
                      </h4>

                      <p className="text-sm text-slate-500 mt-1">
                        Class: {question.className}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        question.status === "answered"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {question.status === "answered"
                        ? "Answered"
                        : "Open"}
                    </span>
                  </div>

                  <div className="mt-5 pt-5 border-t">
                    <p className="text-sm font-medium text-slate-700">
                      {question.studentName || "Student"}
                    </p>

                    {question.studentEmail && (
                      <p className="text-xs text-slate-500 mt-1">
                        {question.studentEmail}
                      </p>
                    )}

                    <div className="mt-4 rounded-xl bg-slate-50 border p-4">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {question.message}
                      </p>
                    </div>
                  </div>

                  {question.studentFileName && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {question.studentFileName}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {formatFileSize(question.studentFileSize ?? 0)}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `/api/questions/${question.id}/student-file/view`,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                          className="px-3 py-2 rounded-lg border hover:bg-slate-50"
                        >
                          <ExternalLink size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = `/api/questions/${question.id}/student-file/download`;
                            link.download = question.studentFileName || "attachment";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-3 py-2 rounded-lg border hover:bg-slate-50"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {question.status === "answered" ? (
                    <div className="mt-5 rounded-xl bg-green-50 border border-green-100 p-4">
                      <p className="text-sm font-medium text-green-800">
                        Your response
                      </p>

                      <p className="text-sm text-green-900 mt-2 whitespace-pre-wrap">
                        {question.teacherResponse}
                      </p>

                      {question.teacherFileName && (
                        <a
                          href={`/api/questions/${question.id}/teacher-file/view`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-green-700 hover:underline"
                        >
                          <Paperclip size={15} />
                          {question.teacherFileName}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your answer
                      </label>

                      <textarea
                        id={`answer-${question.id}`}
                        rows={4}
                        placeholder="Write your answer to the student..."
                        className="w-full border rounded-xl px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-blue-500"
                      />

                      <input
                        ref={(element) => {
                          answerFileInputRefs.current[question.id] = element;
                        }}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                        className="hidden"
                        onChange={(event) =>
                          handleAnswerFileChange(question.id, event)
                        }
                      />

                      {answerFiles[question.id] && (
                        <div className="mt-3 flex items-center justify-between rounded-xl border bg-slate-50 p-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Paperclip size={16} className="shrink-0 text-blue-600" />
                            <span className="truncate text-sm text-slate-700">
                              {answerFiles[question.id]?.name}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setAnswerFiles((current) => ({
                                ...current,
                                [question.id]: null,
                              }));

                              const input =
                                answerFileInputRefs.current[question.id];

                              if (input) input.value = "";
                            }}
                            className="text-xs font-semibold text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            answerFileInputRefs.current[question.id]?.click()
                          }
                          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Paperclip size={16} />
                          Attach file or image
                        </button>

                        <button
                          type="button"
                          disabled={answerQuestionMutation.isPending}
                          onClick={() => {
                            const textarea = document.getElementById(
                              `answer-${question.id}`,
                            ) as HTMLTextAreaElement | null;

                            void sendTeacherAnswer(
                              question.id,
                              textarea?.value ?? "",
                            );
                          }}
                          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {answerQuestionMutation.isPending ? (
                            <>
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                              Sending...
                            </>
                          ) : (
                            "Send Answer"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                type="text"
                value={materialSearch}
                onChange={(event) =>
                  setMaterialSearch(event.target.value)
                }
                placeholder="Search materials or files..."
                className="w-full sm:w-72 border rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={materialClassFilter}
                onChange={(event) =>
                  setMaterialClassFilter(event.target.value)
                }
                className="w-full sm:w-56 border rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All classes</option>

                {teacherClasses.map((classItem) => (
                  <option
                    key={classItem.id}
                    value={classItem.id}
                  >
                    {classItem.subjectCode} — {classItem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {materialsQuery.isLoading ? (
            <div className="bg-white border rounded-2xl p-6">
              <p className="text-slate-500">
                Loading materials...
              </p>
            </div>
          ) : materials.length === 0 ? (
            <div className="bg-white border rounded-2xl p-8 text-center">
              <FileText
                size={36}
                className="mx-auto text-slate-300"
              />

              <p className="font-medium text-slate-900 mt-3">
                No materials uploaded yet
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Upload your first study material above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white border rounded-2xl p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900 truncate">
                        {material.title}
                      </h4>

                      <p className="text-sm text-slate-500 mt-1 truncate">
                        {material.fileName}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-2">
                        <span>
                          {formatFileSize(material.fileSize ?? 0)}
                        </span>

                        <span>•</span>

                        <span>
                          {formatMimeType(material.mimeType)}
                        </span>

                        {material.createdAt && (
                          <>
                            <span>•</span>
                            <span>
                              Uploaded{" "}
                              {new Date(
                                material.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {material.description && (
                    <p className="text-sm text-slate-600 mt-4">
                      {material.description}
                    </p>
                  )}

                  <div className="flex gap-2 mt-5 pt-4 border-t">
                    <button
                      onClick={() =>
                        openMaterial(material.id)
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      <ExternalLink size={16} />
                      Open
                    </button>

                    <button
                      onClick={() =>
                        downloadMaterial(
                          material.id,
                          material.fileName,
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border hover:bg-slate-50 transition"
                    >
                      <Download size={16} />
                      Download
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteMaterial(
                          material.id,
                          material.title,
                        )
                      }
                      disabled={deleteMaterialMutation.isPending}
                      className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      title="Delete material"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Teaching Tools */}
        <h3 className="text-xl font-semibold text-slate-900 mt-12 mb-4">
          Teaching Tools
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ActionCard
            icon={<BookOpen size={24} />}
            title="My Classes"
            description="View the classes and subjects you teach."
          />

          <ActionCard
            icon={<ClipboardList size={24} />}
            title="Assignments"
            description="Create and manage assignments for your classes."
          />

          <ActionCard
            icon={<Users size={24} />}
            title="Student Submissions"
            description="Review submitted assignments and provide feedback."
          />

          <ActionCard
            icon={<Megaphone size={24} />}
            title="Announcements"
            description="Post announcements for your students."
          />
        </div>
      </main>
    </div>
  );
}

function formatMimeType(mimeType: string | null | undefined) {
  if (!mimeType) return "File";

  const labels: Record<string, string> = {
    "application/pdf": "PDF",
    "application/msword": "Word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "Word",
    "application/vnd.ms-powerpoint": "PowerPoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PowerPoint",
    "application/vnd.ms-excel": "Excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "Excel",
    "text/plain": "Text",
    "text/csv": "CSV",
    "image/png": "PNG Image",
    "image/jpeg": "JPEG Image",
    "image/webp": "WebP Image",
    "video/webm": "WebM Video",
    "video/mp4": "MP4 Video",
  };

  if (labels[mimeType]) {
    return labels[mimeType];
  }

  const slashIndex = mimeType.indexOf("/");
  if (slashIndex !== -1) {
    return mimeType.slice(slashIndex + 1).toUpperCase();
  }

  return mimeType;
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>

        <span className="text-3xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {title}
      </p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button className="bg-white border rounded-2xl p-6 text-left hover:shadow-md hover:border-blue-200 transition">
      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        {icon}
      </div>

      <h4 className="font-semibold text-lg text-slate-900">
        {title}
      </h4>

      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        {description}
      </p>
    </button>
  );
}
