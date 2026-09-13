import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

/* =========================================================
   USERS
   ========================================================= */

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),

  // OAuth identifier
  openId: varchar("openId", { length: 64 }).notNull().unique(),

  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),

  // College portal role
  role: mysqlEnum("role", ["student", "teacher", "admin"])
    .default("student")
    .notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;


/* =========================================================
   SUBJECTS
   ========================================================= */

export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;


/* =========================================================
   CLASSES
   ========================================================= */

export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 150 }).notNull(),

  subjectId: int("subjectId")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  teacherId: int("teacherId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  academicYear: varchar("academicYear", { length: 20 }),
  description: text("description"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;


/* =========================================================
   CLASS ENROLLMENTS
   ========================================================= */

export const classEnrollments = mysqlTable(
  "class_enrollments",
  {
    id: int("id").autoincrement().primaryKey(),

    classId: int("classId")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),

    studentId: int("studentId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  },
  (table) => ({
    uniqueEnrollment: unique().on(table.classId, table.studentId),
  }),
);

export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = typeof classEnrollments.$inferInsert;


/* =========================================================
   STUDY MATERIALS
   ========================================================= */

export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  classId: int("classId")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),

  uploadedBy: int("uploadedBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // File information
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  storageKey: varchar("storageKey", { length: 500 }),
  mimeType: varchar("mimeType", { length: 150 }),
  fileSize: int("fileSize"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;


/* =========================================================
   ASSIGNMENTS
   ========================================================= */

export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  classId: int("classId")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),

  createdBy: int("createdBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  dueDate: timestamp("dueDate"),

  attachmentName: varchar("attachmentName", { length: 255 }),
  attachmentUrl: text("attachmentUrl"),
  attachmentKey: varchar("attachmentKey", { length: 500 }),

  isPublished: boolean("isPublished").default(true).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;


/* =========================================================
   ASSIGNMENT SUBMISSIONS
   ========================================================= */

export const submissions = mysqlTable(
  "submissions",
  {
    id: int("id").autoincrement().primaryKey(),

    assignmentId: int("assignmentId")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),

    studentId: int("studentId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    fileName: varchar("fileName", { length: 255 }),
    fileUrl: text("fileUrl"),
    storageKey: varchar("storageKey", { length: 500 }),

    comment: text("comment"),

    grade: int("grade"),
    teacherFeedback: text("teacherFeedback"),

    status: mysqlEnum("status", [
      "submitted",
      "reviewed",
      "returned",
    ])
      .default("submitted")
      .notNull(),

    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    oneSubmissionPerStudent: unique().on(
      table.assignmentId,
      table.studentId,
    ),
  }),
);

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;


/* =========================================================
   STUDENT QUESTIONS
   ========================================================= */

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),

  // The student who asked the question
  studentId: int("studentId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // The teacher responsible for the selected class
  teacherId: int("teacherId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // The class/subject this question belongs to
  classId: int("classId")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),

  // Student's question
  message: text("message").notNull(),

  // Optional student attachment
  studentFileName: varchar("studentFileName", { length: 255 }),
  studentFileUrl: text("studentFileUrl"),
  studentStorageKey: varchar("studentStorageKey", { length: 500 }),
  studentMimeType: varchar("studentMimeType", { length: 150 }),
  studentFileSize: int("studentFileSize"),

  // Teacher's response
  teacherResponse: text("teacherResponse"),

  // Optional teacher solution/feedback attachment
  teacherFileName: varchar("teacherFileName", { length: 255 }),
  teacherFileUrl: text("teacherFileUrl"),
  teacherStorageKey: varchar("teacherStorageKey", { length: 500 }),
  teacherMimeType: varchar("teacherMimeType", { length: 150 }),
  teacherFileSize: int("teacherFileSize"),

  // Question workflow
  status: mysqlEnum("status", [
    "open",
    "answered",
    "closed",
  ])
    .default("open")
    .notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  answeredAt: timestamp("answeredAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;


/* =========================================================
   ANNOUNCEMENTS
   ========================================================= */

export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),

  authorId: int("authorId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // NULL = college-wide announcement
  classId: int("classId").references(() => classes.id, {
    onDelete: "cascade",
  }),

  isPublished: boolean("isPublished").default(true).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
/* =========================================================
   PASSWORD RESET TOKENS
   ========================================================= */

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),

  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  tokenHash: varchar("tokenHash", { length: 255 }).notNull(),

  expiresAt: timestamp("expiresAt").notNull(),

  usedAt: timestamp("usedAt"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
