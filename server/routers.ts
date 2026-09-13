import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createLocalUser,
  createTeacherUser,
  createSubject,
  updateSubject,
    deleteSubject,
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,

  getSubjects,
  getTeachers,
  getStudentClasses,
  getTeacherClasses,
  getTeacherStudents,
  getStudentMaterials,
  getTeacherMaterials,
  getStudentAssignments,
  getTeacherAssignments,
  getStudentSubmissions,
  getAssignmentSubmissions,
  getStudentAnnouncements,
  getTeacherAnnouncements,
  getUserByEmail,
  getDb,
  createPasswordResetToken,
  getPasswordResetToken,
  markPasswordResetTokenUsed,
  createMaterial,
  deleteMaterial,
  createQuestion,
  getStudentQuestions,
  getTeacherQuestions,
  getQuestionById,
  answerQuestion,
getStudents,
getClassStudents,
enrollStudent,
removeStudentFromClass,
} from "./db";
import { users, materials, questions, classes, classEnrollments } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { hashResetToken, generateResetToken } from "./_core/passwordReset";
import { sendPasswordResetEmail } from "./_core/email";
import { ENV } from "./_core/env";
import { hashPassword, verifyPassword } from "./_core/password";
import { sdk } from "./_core/sdk";
import {
  saveMaterialFile,
  deleteMaterialFile,
  saveQuestionFile,
  deleteQuestionFile,
} from "./localStorage";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    register: publicProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid registration data",
          });
        }

        const data = value as Record<string, unknown>;
 
        if (
             typeof data.name !== "string" ||
             data.name.trim().length < 2 ||
             typeof data.email !== "string" ||
             !data.email.includes("@") ||
             typeof data.password !== "string" ||
           data.password.length < 8
          ) {         
            throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Name, valid email, password of at least 8 characters",
          });
        }

        return {
  name: data.name.trim(),
  email: data.email.trim().toLowerCase(),
  password: data.password,
};
      })
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists",
          });
        }

        const passwordHash = await hashPassword(input.password);
        const openId = `local_${randomUUID()}`;

        const user = await createLocalUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          role: "student",
        });

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create account",
          });
        }

        const token = await sdk.signSession({
          openId: user.openId,
          appId: "brcm-local",
          name: user.name ?? input.name,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);

        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          httpOnly: true,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }),

    login: publicProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid login data",
          });
        }

        const data = value as Record<string, unknown>;

        if (
          typeof data.email !== "string" ||
          !data.email.includes("@") ||
          typeof data.password !== "string"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email and password are required",
          });
        }

        return {
          email: data.email.trim().toLowerCase(),
          password: data.password,
        };
      })
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);

        if (!user?.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const valid = await verifyPassword(
          input.password,
          user.passwordHash,
        );

        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const token = await sdk.signSession({
          openId: user.openId,
          appId: "brcm-local",
          name: user.name ?? "",
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);

        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          httpOnly: true,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }),
         forgotPassword: publicProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email is required",
          });
        }

        const data = value as Record<string, unknown>;

        if (
          typeof data.email !== "string" ||
          !data.email.includes("@")
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Valid email is required",
          });
        }

        return {
          email: data.email.trim().toLowerCase(),
        };
      })
      .mutation(async ({ input }) => {
        const user = await getUserByEmail(input.email);

        if (!user || !user.passwordHash) {
          return {
            success: true,
            message:
              "If an account exists for this email, a password reset link has been generated.",
          };
        }

        const token = generateResetToken();
        const tokenHash = hashResetToken(token);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await createPasswordResetToken({
          userId: user.id,
          tokenHash,
          expiresAt,
        });

        const resetUrl = `${ENV.appBaseUrl}/reset-password?token=${token}`;

        await sendPasswordResetEmail(input.email, resetUrl);

        return {
          success: true,
          message:
            "If an account exists for this email, a password reset link has been sent to your email.",
        };
      }),

    resetPassword: publicProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid password reset data",
          });
        }

        const data = value as Record<string, unknown>;

        if (
          typeof data.token !== "string" ||
          !data.token.trim() ||
          typeof data.password !== "string" ||
          data.password.length < 8
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Reset token and password of at least 8 characters are required",
          });
        }

        return {
          token: data.token.trim(),
          password: data.password,
        };
      })
      .mutation(async ({ input }) => {
        const tokenHash = hashResetToken(input.token);
        const resetToken = await getPasswordResetToken(tokenHash);

        if (!resetToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired password reset link",
          });
        }

        if (resetToken.usedAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This password reset link has already been used",
          });
        }

        if (new Date(resetToken.expiresAt).getTime() <= Date.now()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This password reset link has expired",
          });
        }

        const passwordHash = await hashPassword(input.password);

        const db = await getDb();

        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        await db
          .update(users)
          .set({
            passwordHash,
          })
          .where(eq(users.id, resetToken.userId));

        await markPasswordResetTokenUsed(resetToken.id);

        return {
          success: true,
          message: "Password reset successfully. You can now log in.",
        };
      }),

    me: publicProcedure.query(({ ctx }) => {
      const user = ctx.user;

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSignedIn: user.lastSignedIn,
      };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);

      ctx.res.clearCookie(COOKIE_NAME, {
        ...cookieOptions,
        maxAge: -1,
      });

      return {
        success: true,
      } as const;
    }),
  }),

    admin: router({
    students: adminProcedure
  .query(async () => {
    return getStudents();
  }),

classStudents: adminProcedure
  .input((value: unknown) => {
    if (
      typeof value !== "object" ||
      value === null ||
      !("classId" in value) ||
      typeof (value as { classId?: unknown }).classId !== "number"
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "classId is required",
      });
    }

    return {
      classId: (value as { classId: number }).classId,
    };
  })
  .query(async ({ input }) => {
    return getClassStudents(input.classId);
  }),

enrollStudent: adminProcedure
  .input((value: unknown) => {
    if (
      typeof value !== "object" ||
      value === null ||
      !("classId" in value) ||
      !("studentId" in value) ||
      typeof (value as { classId?: unknown }).classId !== "number" ||
      typeof (value as { studentId?: unknown }).studentId !== "number"
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "classId and studentId are required",
      });
    }

    return {
      classId: (value as { classId: number }).classId,
      studentId: (value as { studentId: number }).studentId,
    };
  })
  .mutation(async ({ input }) => {
    return enrollStudent(input.classId, input.studentId);
  }),

removeStudent: adminProcedure
  .input((value: unknown) => {
    if (
      typeof value !== "object" ||
      value === null ||
      !("enrollmentId" in value) ||
      typeof (value as { enrollmentId?: unknown }).enrollmentId !== "number"
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "enrollmentId is required",
      });
    }

    return {
      enrollmentId: (value as { enrollmentId: number }).enrollmentId,
    };
  })
  .mutation(async ({ input }) => {
    return removeStudentFromClass(input.enrollmentId);
  }),
    createTeacher: adminProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid teacher data",
          });
        }

        const data = value as Record<string, unknown>;

        if (
          typeof data.name !== "string" ||
          data.name.trim().length < 2 ||
          typeof data.email !== "string" ||
          !data.email.includes("@") ||
          typeof data.password !== "string" ||
          data.password.length < 8
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Teacher name, valid email, and password of at least 8 characters are required",
          });
        }

        return {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
        };
      })
      .mutation(async ({ input }) => {
        const existing = await getUserByEmail(input.email);

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists",
          });
        }

        const passwordHash = await hashPassword(input.password);
        const openId = `local_teacher_${randomUUID()}`;

        const teacher = await createTeacherUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
        });

        if (!teacher) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create teacher account",
          });
        }

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
        };
      }),

    listSubjects: adminProcedure.query(async () => {
      return getSubjects();
        
       }),
        listTeachers: adminProcedure.query(async () => {
      return getTeachers();
   
    }),

    createSubject: adminProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid subject data",
          });
        }

        const data = value as Record<string, unknown>;

        if (
          typeof data.name !== "string" ||
          data.name.trim().length < 2 ||
          typeof data.code !== "string" ||
          data.code.trim().length < 2
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Subject name and code are required",
          });
        }

        return {
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          description:
            typeof data.description === "string"
              ? data.description.trim()
              : undefined,
        };
      })
      .mutation(async ({ input }) => {
        try {
          return await createSubject(input);
        } catch (error) {
          const message = String(error);

          if (message.includes("Duplicate entry")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A subject with this code already exists",
            });
          }

          throw error;
        }
      }),

    updateSubject: adminProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid subject data",
          });
        }

        const data = value as Record<string, unknown>;

        if (
          typeof data.id !== "number" ||
          typeof data.name !== "string" ||
          data.name.trim().length < 2 ||
          typeof data.code !== "string" ||
          data.code.trim().length < 2
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Subject ID, name and code are required",
          });
        }

        return {
          id: data.id,
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          description:
            typeof data.description === "string"
              ? data.description.trim()
              : undefined,
        };
      })
      .mutation(async ({ input }) => {
        try {
          return await updateSubject(input.id, {
            name: input.name,
            code: input.code,
            description: input.description,
          });
        } catch (error) {
          const message = String(error);

          if (message.includes("Duplicate entry")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A subject with this code already exists",
            });
          }

          throw error;
        }
      }),

    deleteSubject: adminProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid subject data",
          });
        }

        const data = value as Record<string, unknown>;

        if (typeof data.id !== "number") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Subject ID is required",
          });
        }

        return { id: data.id };
      })
            .mutation(async ({ input }) => {
        return deleteSubject(input.id);
      }),

    listClasses: adminProcedure.query(async () => {
      return getAllClasses();
    }),

    createClass: adminProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid class data",
          });
        }

        const data = value as Record<string, unknown>;

        if (
          typeof data.name !== "string" ||
          data.name.trim().length < 2 ||
          typeof data.subjectId !== "number" ||
          typeof data.teacherId !== "number"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Class name, subject and teacher are required",
          });
        }

        return {
          name: data.name.trim(),
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          academicYear:
            typeof data.academicYear === "string"
              ? data.academicYear.trim()
              : undefined,
          description:
            typeof data.description === "string"
              ? data.description.trim()
              : undefined,
        };
      })
      .mutation(async ({ input }) => {
        return createClass(input);
      }),

    updateClass: adminProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid class data",
          });
        }

        const data = value as Record<string, unknown>;

        if (
          typeof data.id !== "number" ||
          typeof data.name !== "string" ||
          data.name.trim().length < 2 ||
          typeof data.subjectId !== "number" ||
          typeof data.teacherId !== "number"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Class ID, name, subject and teacher are required",
          });
        }

        return {
          id: data.id,
          name: data.name.trim(),
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          academicYear:
            typeof data.academicYear === "string"
              ? data.academicYear.trim()
              : undefined,
          description:
            typeof data.description === "string"
              ? data.description.trim()
              : undefined,
        };
      })
      .mutation(async ({ input }) => {
        return updateClass(input.id, {
          name: input.name,
          subjectId: input.subjectId,
          teacherId: input.teacherId,
          academicYear: input.academicYear,
          description: input.description,
        });
      }),

    deleteClass: adminProcedure
      .input((value: unknown) => {
        if (!value || typeof value !== "object") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid class data",
          });
        }

        const data = value as Record<string, unknown>;

        if (typeof data.id !== "number") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Class ID is required",
          });
        }

        return { id: data.id };
      })
      .mutation(async ({ input }) => {
        return deleteClass(input.id);
      }),
  }),

  portal: router({
    /**
     * Available to authenticated students and teachers.
     */
    subjects: protectedProcedure.query(async () => {
      return getSubjects();
    }),

    /**
     * Classes belonging to the currently logged-in student.
     */
    studentClasses: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "student" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Student access required",
        });
      }

      return getStudentClasses(ctx.user.id);
    }),

    /**
     * Classes belonging to the currently logged-in teacher.
     */
    teacherClasses: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Teacher access required",
        });
      }

      return getTeacherClasses(ctx.user.id);
    }),

    /**
     * Students enrolled in classes taught by the currently logged-in teacher.
     */
    teacherStudents: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Teacher access required",
        });
      }

      return getTeacherStudents(ctx.user.id);
    }),

    /**
     * Questions asked by the currently logged-in student.
     */
    studentQuestions: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "student" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Student access required",
        });
      }

      return getStudentQuestions(ctx.user.id);
    }),

    /**
     * Questions assigned to the currently logged-in teacher.
     */
    teacherQuestions: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Teacher access required",
        });
      }

      return getTeacherQuestions(ctx.user.id);
    }),

    /**
     * Create a question from a student to the teacher of an enrolled class.
     */
    createQuestion: protectedProcedure
      .input((value: unknown) => {
        if (
          typeof value !== "object" ||
          value === null ||
          !("classId" in value) ||
          !("message" in value) ||
          typeof value.classId !== "number" ||
          typeof value.message !== "string"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid question data",
          });
        }

        const message = value.message.trim();

        if (!message) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Question cannot be empty",
          });
        }

        if (message.length > 10000) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Question is too long",
          });
        }

        let fileName: string | undefined;
        let mimeType: string | undefined;
        let fileSize: number | undefined;
        let fileData: string | undefined;

        if ("fileName" in value && value.fileName !== undefined) {
          if (
            typeof value.fileName !== "string" ||
            value.fileName.trim().length === 0
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment file name",
            });
          }

          fileName = value.fileName.trim();
        }

        if ("mimeType" in value && value.mimeType !== undefined) {
          if (typeof value.mimeType !== "string") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment type",
            });
          }

          mimeType = value.mimeType;
        }

        if ("fileSize" in value && value.fileSize !== undefined) {
          if (
            typeof value.fileSize !== "number" ||
            !Number.isInteger(value.fileSize) ||
            value.fileSize <= 0
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment size",
            });
          }

          if (value.fileSize > 50 * 1024 * 1024) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Attachment must be 50 MB or smaller",
            });
          }

          fileSize = value.fileSize;
        }

        if ("fileData" in value && value.fileData !== undefined) {
          if (typeof value.fileData !== "string") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment data",
            });
          }

          fileData = value.fileData;
        }

        const hasAnyFileField =
          fileName !== undefined ||
          mimeType !== undefined ||
          fileSize !== undefined ||
          fileData !== undefined;

        if (
          hasAnyFileField &&
          (!fileName || !mimeType || !fileSize || !fileData)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Attachment information is incomplete",
          });
        }

        return {
          classId: value.classId,
          message,
          fileName,
          mimeType,
          fileSize,
          fileData,
        };
      })
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "student") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Student access required",
          });
        }

        const db = await getDb();

        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        const enrollment = await db
          .select({
            classId: classEnrollments.classId,
          })
          .from(classEnrollments)
          .where(
            and(
              eq(classEnrollments.classId, input.classId),
              eq(classEnrollments.studentId, ctx.user.id),
            ),
          )
          .limit(1);

        if (!enrollment[0]) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not enrolled in this class",
          });
        }

        const classResult = await db
          .select({
            id: classes.id,
            teacherId: classes.teacherId,
          })
          .from(classes)
          .where(eq(classes.id, input.classId))
          .limit(1);

        const selectedClass = classResult[0];

        if (!selectedClass) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        let studentFileName: string | null = null;
        let studentFileUrl: string | null = null;
        let studentStorageKey: string | null = null;
        let studentMimeType: string | null = null;
        let studentFileSize: number | null = null;

        if (input.fileData && input.fileName && input.mimeType && input.fileSize) {
          let fileBuffer: Buffer;

          try {
            fileBuffer = Buffer.from(input.fileData, "base64");
          } catch {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment data",
            });
          }

          if (fileBuffer.length !== input.fileSize) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Attachment size does not match the uploaded file",
            });
          }

          const savedFile = await saveQuestionFile(
            input.fileName,
            fileBuffer,
          );

          studentFileName = input.fileName;
          studentFileUrl = savedFile.fileUrl;
          studentStorageKey = savedFile.storageKey;
          studentMimeType = input.mimeType;
          studentFileSize = input.fileSize;
        }

        return createQuestion({
          studentId: ctx.user.id,
          teacherId: selectedClass.teacherId,
          classId: selectedClass.id,
          message: input.message,
          studentFileName,
          studentFileUrl,
          studentStorageKey,
          studentMimeType,
          studentFileSize,
        });
      }),

    /**
     * Answer a student's question.
     */
    answerQuestion: protectedProcedure
      .input((value: unknown) => {
        if (
          typeof value !== "object" ||
          value === null ||
          !("questionId" in value) ||
          !("teacherResponse" in value) ||
          typeof value.questionId !== "number" ||
          typeof value.teacherResponse !== "string"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid answer data",
          });
        }

        const teacherResponse = value.teacherResponse.trim();

        if (!teacherResponse) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Answer cannot be empty",
          });
        }

        if (teacherResponse.length > 10000) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Answer is too long",
          });
        }

        let fileName: string | undefined;
        let mimeType: string | undefined;
        let fileSize: number | undefined;
        let fileData: string | undefined;

        if ("fileName" in value && value.fileName !== undefined) {
          if (
            typeof value.fileName !== "string" ||
            value.fileName.trim().length === 0
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment file name",
            });
          }

          fileName = value.fileName.trim();
        }

        if ("mimeType" in value && value.mimeType !== undefined) {
          if (typeof value.mimeType !== "string") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment type",
            });
          }

          mimeType = value.mimeType;
        }

        if ("fileSize" in value && value.fileSize !== undefined) {
          if (
            typeof value.fileSize !== "number" ||
            !Number.isInteger(value.fileSize) ||
            value.fileSize <= 0
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment size",
            });
          }

          if (value.fileSize > 50 * 1024 * 1024) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Attachment must be 50 MB or smaller",
            });
          }

          fileSize = value.fileSize;
        }

        if ("fileData" in value && value.fileData !== undefined) {
          if (typeof value.fileData !== "string") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment data",
            });
          }

          fileData = value.fileData;
        }

        const hasAnyFileField =
          fileName !== undefined ||
          mimeType !== undefined ||
          fileSize !== undefined ||
          fileData !== undefined;

        if (
          hasAnyFileField &&
          (!fileName || !mimeType || !fileSize || !fileData)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Attachment information is incomplete",
          });
        }

        return {
          questionId: value.questionId,
          teacherResponse,
          fileName,
          mimeType,
          fileSize,
          fileData,
        };
      })
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Teacher access required",
          });
        }

        const question = await getQuestionById(input.questionId);

        if (!question) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Question not found",
          });
        }

        if (
          ctx.user.role !== "admin" &&
          question.teacherId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not teach this student",
          });
        }

        let teacherFileName: string | null = null;
        let teacherFileUrl: string | null = null;
        let teacherStorageKey: string | null = null;
        let teacherMimeType: string | null = null;
        let teacherFileSize: number | null = null;

        if (
          input.fileData &&
          input.fileName &&
          input.mimeType &&
          input.fileSize
        ) {
          let fileBuffer: Buffer;

          try {
            fileBuffer = Buffer.from(input.fileData, "base64");
          } catch {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid attachment data",
            });
          }

          if (fileBuffer.length !== input.fileSize) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Attachment size does not match the uploaded file",
            });
          }

          const savedFile = await saveQuestionFile(
            input.fileName,
            fileBuffer,
          );

          teacherFileName = input.fileName;
          teacherFileUrl = savedFile.fileUrl;
          teacherStorageKey = savedFile.storageKey;
          teacherMimeType = input.mimeType;
          teacherFileSize = input.fileSize;
        }

        return answerQuestion(input.questionId, {
          teacherResponse: input.teacherResponse,
          teacherFileName,
          teacherFileUrl,
          teacherStorageKey,
          teacherMimeType,
          teacherFileSize,
        });
      }),

    /**
     * Study materials visible to the current student.
     */
    studentMaterials: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "student" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Student access required",
        });
      }

      return getStudentMaterials(ctx.user.id);
    }),

    /**
     * Materials uploaded by the current teacher.
     */
    teacherMaterials: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Teacher access required",
        });
      }

      return getTeacherMaterials(ctx.user.id);
    }),

    /**
     * Delete a material uploaded to a class taught by the current teacher.
     */
    deleteMaterial: protectedProcedure
      .input((value: unknown) => {
        if (
          typeof value !== "object" ||
          value === null ||
          !("materialId" in value) ||
          typeof value.materialId !== "number"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid material ID",
          });
        }

        return value as { materialId: number };
      })
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Teacher access required",
          });
        }

        const db = await getDb();

        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        const materialResult = await db
          .select()
          .from(materials)
          .where(eq(materials.id, input.materialId))
          .limit(1);

        const material = materialResult[0];

        if (!material) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Material not found",
          });
        }

        if (ctx.user.role !== "admin") {
          const teacherClasses = await getTeacherClasses(ctx.user.id);

          if (
            !teacherClasses.some(
              classItem => classItem.id === material.classId,
            )
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not teach this class",
            });
          }
        }

        if (material.storageKey) {
          await deleteMaterialFile(material.storageKey);
        }

        await deleteMaterial(input.materialId);

        return {
          success: true,
          message: "Material deleted successfully",
        };
      }),

    /**
     * Assignments visible to the current student.
     */
    uploadMaterial: protectedProcedure
      .input((value: unknown) => {
        if (
          typeof value !== "object" ||
          value === null ||
          !("classId" in value) ||
          !("title" in value) ||
          !("fileName" in value) ||
          !("mimeType" in value) ||
          !("fileSize" in value) ||
          !("fileData" in value) ||
          typeof value.classId !== "number" ||
          typeof value.title !== "string" ||
          typeof value.fileName !== "string" ||
          typeof value.mimeType !== "string" ||
          typeof value.fileSize !== "number" ||
          typeof value.fileData !== "string"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid material upload data",
          });
        }

        return value as {
          classId: number;
          title: string;
          description?: string;
          fileName: string;
          mimeType: string;
          fileSize: number;
          fileData: string;
        };
      })
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Teacher access required",
          });
        }

        const teacherClasses = await getTeacherClasses(ctx.user.id);

        if (
          ctx.user.role !== "admin" &&
          !teacherClasses.some(classItem => classItem.id === input.classId)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not teach this class",
          });
        }

        if (input.fileSize > 50 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File must be smaller than 50 MB",
          });
        }

        const fileBuffer = Buffer.from(input.fileData, "base64");

        if (fileBuffer.length !== input.fileSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Uploaded file is invalid",
          });
        }

        const saved = await saveMaterialFile(
          input.fileName,
          fileBuffer,
        );

        const material = await createMaterial({
          title: input.title,
          description: input.description,
          classId: input.classId,
          uploadedBy: ctx.user.id,
          fileName: input.fileName,
          fileUrl: saved.fileUrl,
          storageKey: saved.storageKey,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
        });

        return material;
      }),
    studentAssignments: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "student" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Student access required",
        });
      }

      return getStudentAssignments(ctx.user.id);
    }),

    /**
     * Assignments created by the current teacher.
     */
    teacherAssignments: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Teacher access required",
        });
      }

      return getTeacherAssignments(ctx.user.id);
    }),

    /**
     * Submissions belonging to the current student.
     */
    studentSubmissions: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "student" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Student access required",
        });
      }

      return getStudentSubmissions(ctx.user.id);
    }),

    /**
     * Submissions for one assignment.
     * The DB query itself verifies that the teacher owns the class.
     */
    assignmentSubmissions: protectedProcedure
      .input((value: unknown) => {
        if (
          typeof value !== "object" ||
          value === null ||
          !("assignmentId" in value) ||
          typeof value.assignmentId !== "number"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "assignmentId is required",
          });
        }

        return value as { assignmentId: number };
      })
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Teacher access required",
          });
        }

        return getAssignmentSubmissions(
          input.assignmentId,
          ctx.user.id
        );
      }),

    /**
     * Announcements visible to the current student.
     */
    studentAnnouncements: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "student" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Student access required",
        });
      }

      return getStudentAnnouncements(ctx.user.id);
    }),

    /**
     * Announcements created by the current teacher.
     */
    teacherAnnouncements: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Teacher access required",
        });
      }

      return getTeacherAnnouncements(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
