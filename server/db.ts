import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  subjects,
  classes,
  classEnrollments,
  materials,
  assignments,
  submissions,
  announcements,
  questions,
  passwordResetTokens,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/* ─────────────────────────────────────────────
   USERS
───────────────────────────────────────────── */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };

    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;

      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();

  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/* ─────────────────────────────────────────────
   SUBJECTS
───────────────────────────────────────────── */

export async function getSubjects() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select()
    .from(subjects)
    .orderBy(subjects.name);
}

/* ─────────────────────────────────────────────
   CLASSES
───────────────────────────────────────────── */

export async function getStudentClasses(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: classes.id,
      name: classes.name,
      subjectId: classes.subjectId,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      teacherId: classes.teacherId,
      teacherName: users.name,
      academicYear: classes.academicYear,
      description: classes.description,
    })
    .from(classes)
    .innerJoin(
      classEnrollments,
      eq(classEnrollments.classId, classes.id)
    )
    .innerJoin(
      subjects,
      eq(classes.subjectId, subjects.id)
    )
    .innerJoin(
      users,
      eq(classes.teacherId, users.id)
    )
    .where(eq(classEnrollments.studentId, studentId))
    .orderBy(classes.name);
}

export async function getTeacherClasses(teacherId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: classes.id,
      name: classes.name,
      subjectId: classes.subjectId,
      subjectCode: subjects.code,
      subjectName: subjects.name,
      teacherId: classes.teacherId,
      academicYear: classes.academicYear,
      description: classes.description,
      createdAt: classes.createdAt,
    })
    .from(classes)
    .innerJoin(subjects, eq(classes.subjectId, subjects.id))
    .where(eq(classes.teacherId, teacherId))
    .orderBy(classes.name);
}

/* ─────────────────────────────────────────────
   MATERIALS
───────────────────────────────────────────── */

export async function getStudentMaterials(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: materials.id,
      title: materials.title,
      description: materials.description,
      classId: materials.classId,
      fileName: materials.fileName,
      fileUrl: materials.fileUrl,
      storageKey: materials.storageKey,
      mimeType: materials.mimeType,
      fileSize: materials.fileSize,
      createdAt: materials.createdAt,
    })
    .from(materials)
    .innerJoin(
      classEnrollments,
      eq(classEnrollments.classId, materials.classId)
    )
    .where(eq(classEnrollments.studentId, studentId))
    .orderBy(desc(materials.createdAt));
}

export async function getTeacherMaterials(teacherId: number) {
  const db = await getDb();

  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: materials.id,
      title: materials.title,
      description: materials.description,
      classId: materials.classId,
      uploadedBy: materials.uploadedBy,
      fileName: materials.fileName,
      fileUrl: materials.fileUrl,
      storageKey: materials.storageKey,
      mimeType: materials.mimeType,
      fileSize: materials.fileSize,
      createdAt: materials.createdAt,
    })
    .from(materials)
    .innerJoin(
      classes,
      eq(classes.id, materials.classId)
    )
    .where(eq(classes.teacherId, teacherId))
    .orderBy(desc(materials.createdAt));
}

/* ─────────────────────────────────────────────
   ASSIGNMENTS
───────────────────────────────────────────── */

export async function getStudentAssignments(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      classId: assignments.classId,
      createdBy: assignments.createdBy,
      dueDate: assignments.dueDate,
      attachmentName: assignments.attachmentName,
      attachmentUrl: assignments.attachmentUrl,
      isPublished: assignments.isPublished,
      createdAt: assignments.createdAt,
    })
    .from(assignments)
    .innerJoin(
      classEnrollments,
      eq(classEnrollments.classId, assignments.classId)
    )
    .where(
      and(
        eq(classEnrollments.studentId, studentId),
        eq(assignments.isPublished, true)
      )
    )
    .orderBy(desc(assignments.createdAt));
}

export async function getTeacherAssignments(teacherId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select()
    .from(assignments)
    .innerJoin(
      classes,
      eq(classes.id, assignments.classId)
    )
    .where(eq(classes.teacherId, teacherId))
    .orderBy(desc(assignments.createdAt));
}

/* ─────────────────────────────────────────────
   SUBMISSIONS
───────────────────────────────────────────── */

export async function getStudentSubmissions(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select()
    .from(submissions)
    .where(eq(submissions.studentId, studentId))
    .orderBy(desc(submissions.submittedAt));
}

export async function getAssignmentSubmissions(
  assignmentId: number,
  teacherId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: submissions.id,
      assignmentId: submissions.assignmentId,
      studentId: submissions.studentId,
      fileName: submissions.fileName,
      fileUrl: submissions.fileUrl,
      storageKey: submissions.storageKey,
      comment: submissions.comment,
      grade: submissions.grade,
      teacherFeedback: submissions.teacherFeedback,
      status: submissions.status,
      submittedAt: submissions.submittedAt,
      studentName: users.name,
      studentEmail: users.email,
    })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.studentId))
    .innerJoin(
      assignments,
      eq(assignments.id, submissions.assignmentId)
    )
    .innerJoin(
      classes,
      eq(classes.id, assignments.classId)
    )
    .where(
      and(
        eq(submissions.assignmentId, assignmentId),
        eq(classes.teacherId, teacherId)
      )
    )
    .orderBy(desc(submissions.submittedAt));
}

/* ─────────────────────────────────────────────
   ANNOUNCEMENTS
───────────────────────────────────────────── */

export async function getStudentAnnouncements(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      authorId: announcements.authorId,
      classId: announcements.classId,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .leftJoin(
      classEnrollments,
      eq(classEnrollments.classId, announcements.classId)
    )
    .where(
      and(
        eq(classEnrollments.studentId, studentId),
        eq(announcements.isPublished, true)
      )
    )
    .orderBy(desc(announcements.createdAt));
}

export async function getTeacherAnnouncements(teacherId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select()
    .from(announcements)
    .where(eq(announcements.authorId, teacherId))
    .orderBy(desc(announcements.createdAt));
}

/* ─────────────────────────────────────────────
   LOCAL AUTHENTICATION
───────────────────────────────────────────── */

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(input: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "student" | "teacher";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(users).values({
    openId: input.openId,
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    role: input.role,
    loginMethod: "local",
    lastSignedIn: new Date(),
  });

  return getUserByEmail(input.email);
}
export async function createTeacherUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  openId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(users).values({
    openId: input.openId,
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    role: "teacher",
    loginMethod: "local",
    lastSignedIn: new Date(),
  });

  return getUserByEmail(input.email);
}

export async function createSubject(input: {
  name: string;
  code: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(subjects).values({
    name: input.name,
    code: input.code,
    description: input.description ?? null,
  });

  return db
    .select()
    .from(subjects)
    .where(eq(subjects.code, input.code))
    .limit(1);
}

export async function updateSubject(
  id: number,
  input: {
    name: string;
    code: string;
    description?: string;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(subjects)
    .set({
      name: input.name,
      code: input.code,
      description: input.description ?? null,
    })
    .where(eq(subjects.id, id));

  return db
    .select()
    .from(subjects)
    .where(eq(subjects.id, id))
    .limit(1);
}

export async function deleteSubject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .delete(subjects)
    .where(eq(subjects.id, id));

  return { success: true };
}
export async function getAllClasses() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: classes.id,
      name: classes.name,
      subjectId: classes.subjectId,
      subjectCode: subjects.code,
      subjectName: subjects.name,
      teacherId: classes.teacherId,
      teacherName: users.name,
      teacherEmail: users.email,
      academicYear: classes.academicYear,
      description: classes.description,
      createdAt: classes.createdAt,
    })
    .from(classes)
    .innerJoin(subjects, eq(classes.subjectId, subjects.id))
    .innerJoin(users, eq(classes.teacherId, users.id))
    .orderBy(classes.name);
}

export async function createClass(input: {
  name: string;
  subjectId: number;
  teacherId: number;
  academicYear?: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(classes).values({
    name: input.name,
    subjectId: input.subjectId,
    teacherId: input.teacherId,
    academicYear: input.academicYear ?? null,
    description: input.description ?? null,
  });

  return getAllClasses();
}

export async function updateClass(
  id: number,
  input: {
    name: string;
    subjectId: number;
    teacherId: number;
    academicYear?: string;
    description?: string;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(classes)
    .set({
      name: input.name,
      subjectId: input.subjectId,
      teacherId: input.teacherId,
      academicYear: input.academicYear ?? null,
      description: input.description ?? null,
    })
    .where(eq(classes.id, id));

  return getAllClasses();
}

export async function deleteClass(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .delete(classes)
    .where(eq(classes.id, id));

  return { success: true };
}
export async function getTeachers() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, "teacher"))
    .orderBy(users.name);
}

export async function createMaterial(input: {
  title: string;
  description?: string;
  classId: number;
  uploadedBy: number;
  fileName: string;
  fileUrl: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(materials).values({
    title: input.title,
    description: input.description ?? null,
    classId: input.classId,
    uploadedBy: input.uploadedBy,
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    storageKey: input.storageKey,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
  });

  const result = await db
    .select()
    .from(materials)
    .where(eq(materials.storageKey, input.storageKey))
    .limit(1);

  return result[0];
}
export async function deleteMaterial(materialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db
    .delete(materials)
    .where(eq(materials.id, materialId));

  return result;
}

export async function createQuestion(input: {
  studentId: number;
  teacherId: number;
  classId: number;
  message: string;
  studentFileName?: string | null;
  studentFileUrl?: string | null;
  studentStorageKey?: string | null;
  studentMimeType?: string | null;
  studentFileSize?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(questions).values({
    studentId: input.studentId,
    teacherId: input.teacherId,
    classId: input.classId,
    message: input.message,
    studentFileName: input.studentFileName ?? null,
    studentFileUrl: input.studentFileUrl ?? null,
    studentStorageKey: input.studentStorageKey ?? null,
    studentMimeType: input.studentMimeType ?? null,
    studentFileSize: input.studentFileSize ?? null,
  });

  const result = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.studentId, input.studentId),
        eq(questions.classId, input.classId),
        eq(questions.message, input.message),
      ),
    )
    .orderBy(desc(questions.createdAt))
    .limit(1);

  return result[0];
}

export async function getStudentQuestions(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: questions.id,
      studentId: questions.studentId,
      teacherId: questions.teacherId,
      classId: questions.classId,
      message: questions.message,
      studentFileName: questions.studentFileName,
      studentFileUrl: questions.studentFileUrl,
      studentStorageKey: questions.studentStorageKey,
      studentMimeType: questions.studentMimeType,
      studentFileSize: questions.studentFileSize,
      teacherResponse: questions.teacherResponse,
      teacherFileName: questions.teacherFileName,
      teacherFileUrl: questions.teacherFileUrl,
      teacherStorageKey: questions.teacherStorageKey,
      teacherMimeType: questions.teacherMimeType,
      teacherFileSize: questions.teacherFileSize,
      status: questions.status,
      createdAt: questions.createdAt,
      answeredAt: questions.answeredAt,
      updatedAt: questions.updatedAt,
      className: classes.name,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      teacherName: users.name,
    })
    .from(questions)
    .innerJoin(classes, eq(questions.classId, classes.id))
    .innerJoin(subjects, eq(classes.subjectId, subjects.id))
    .innerJoin(users, eq(questions.teacherId, users.id))
    .where(eq(questions.studentId, studentId))
    .orderBy(desc(questions.createdAt));
}

export async function getTeacherQuestions(teacherId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: questions.id,
      studentId: questions.studentId,
      teacherId: questions.teacherId,
      classId: questions.classId,
      message: questions.message,
      studentFileName: questions.studentFileName,
      studentFileUrl: questions.studentFileUrl,
      studentStorageKey: questions.studentStorageKey,
      studentMimeType: questions.studentMimeType,
      studentFileSize: questions.studentFileSize,
      teacherResponse: questions.teacherResponse,
      teacherFileName: questions.teacherFileName,
      teacherFileUrl: questions.teacherFileUrl,
      teacherStorageKey: questions.teacherStorageKey,
      teacherMimeType: questions.teacherMimeType,
      teacherFileSize: questions.teacherFileSize,
      status: questions.status,
      createdAt: questions.createdAt,
      answeredAt: questions.answeredAt,
      updatedAt: questions.updatedAt,
      studentName: users.name,
      studentEmail: users.email,
      className: classes.name,
      subjectName: subjects.name,
      subjectCode: subjects.code,
    })
    .from(questions)
    .innerJoin(users, eq(questions.studentId, users.id))
    .innerJoin(classes, eq(questions.classId, classes.id))
    .innerJoin(subjects, eq(classes.subjectId, subjects.id))
    .where(eq(questions.teacherId, teacherId))
    .orderBy(desc(questions.createdAt));
}

export async function getQuestionById(questionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  return result[0];
}

export async function answerQuestion(
  questionId: number,
  input: {
    teacherResponse: string;
    teacherFileName?: string | null;
    teacherFileUrl?: string | null;
    teacherStorageKey?: string | null;
    teacherMimeType?: string | null;
    teacherFileSize?: number | null;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(questions)
    .set({
      teacherResponse: input.teacherResponse,
      teacherFileName: input.teacherFileName ?? null,
      teacherFileUrl: input.teacherFileUrl ?? null,
      teacherStorageKey: input.teacherStorageKey ?? null,
      teacherMimeType: input.teacherMimeType ?? null,
      teacherFileSize: input.teacherFileSize ?? null,
      status: "answered",
      answeredAt: new Date(),
    })
    .where(eq(questions.id, questionId));

  return getQuestionById(questionId);
}


export async function getStudents() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(users.name);
}

export async function getClassStudents(classId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      enrollmentId: classEnrollments.id,
    })
    .from(classEnrollments)
    .innerJoin(users, eq(classEnrollments.studentId, users.id))
    .where(eq(classEnrollments.classId, classId))
    .orderBy(users.name);
}

export async function enrollStudent(
  classId: number,
  studentId: number,
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .insert(classEnrollments)
    .values({
      classId,
      studentId,
    })
    .onDuplicateKeyUpdate({
      set: {
        classId,
      },
    });

  return getClassStudents(classId);
}

export async function removeStudentFromClass(enrollmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .delete(classEnrollments)
    .where(eq(classEnrollments.id, enrollmentId));

  return { success: true };
}

export async function getMaterialById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db
    .select({
      id: materials.id,
      title: materials.title,
      description: materials.description,
      classId: materials.classId,
      uploadedBy: materials.uploadedBy,
      fileName: materials.fileName,
      fileUrl: materials.fileUrl,
      storageKey: materials.storageKey,
      mimeType: materials.mimeType,
      fileSize: materials.fileSize,
      createdAt: materials.createdAt,
    })
    .from(materials)
    .where(eq(materials.id, id))
    .limit(1);

  return result[0];
}

export async function createPasswordResetToken(input: {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(passwordResetTokens).values({
    userId: input.userId,
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
  });

  return { success: true };
}

export async function getPasswordResetToken(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  return result[0];
}

export async function markPasswordResetTokenUsed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(passwordResetTokens)
    .set({
      usedAt: new Date(),
    })
    .where(eq(passwordResetTokens.id, id));

  return { success: true };
}
