import type { Express } from "express";
import fs from "node:fs";
import path from "node:path";
import {
  getMaterialById,
  getStudentClasses,
  getTeacherClasses,
  getQuestionById,
} from "./db";
import { sdk } from "./_core/sdk";

async function getAuthorizedMaterial(req: any, materialId: number) {
  const user = await sdk.authenticateRequest(req);

  const material = await getMaterialById(materialId);
  if (!material) {
    throw new Error("Material not found");
  }

  let allowed = user.role === "admin";

  if (user.role === "student") {
    const classes = await getStudentClasses(user.id);
    allowed = classes.some((item) => item.id === material.classId);
  }

  if (user.role === "teacher") {
    const classes = await getTeacherClasses(user.id);
    allowed = classes.some((item) => item.id === material.classId);
  }

  if (!allowed) {
    throw new Error("You do not have access to this material");
  }

  const uploadDir = path.resolve(
    process.cwd(),
    "server/uploads/materials"
  );

  if (!material.storageKey) {
    throw new Error("File storage key is missing");
  }

  const safeStorageKey = path.basename(material.storageKey);
  const filePath = path.join(uploadDir, safeStorageKey);

  if (!fs.existsSync(filePath)) {
    throw new Error("File is missing from storage");
  }

  return { user, material, filePath };
}

async function getAuthorizedQuestion(
  req: any,
  questionId: number,
) {
  const user = await sdk.authenticateRequest(req);

  const question = await getQuestionById(questionId);

  if (!question) {
    throw new Error("Question not found");
  }

  const allowed =
    user.role === "admin" ||
    (user.role === "student" && question.studentId === user.id) ||
    (user.role === "teacher" && question.teacherId === user.id);

  if (!allowed) {
    throw new Error("You do not have access to this question");
  }

  return { user, question };
}

function getQuestionFilePath(
  question: any,
  side: "student" | "teacher",
) {
  const storageKey =
    side === "student"
      ? question.studentStorageKey
      : question.teacherStorageKey;

  if (!storageKey) {
    throw new Error("Question file is missing");
  }

  const uploadDir = path.resolve(
    process.cwd(),
    "server/uploads/questions",
  );

  const safeStorageKey = path.basename(storageKey);
  const filePath = path.join(uploadDir, safeStorageKey);

  if (!fs.existsSync(filePath)) {
    throw new Error("File is missing from storage");
  }

  return filePath;
}

function sendQuestionFile(
  res: any,
  question: any,
  side: "student" | "teacher",
  download: boolean,
) {
  const fileName =
    side === "student"
      ? question.studentFileName
      : question.teacherFileName;

  const mimeType =
    side === "student"
      ? question.studentMimeType
      : question.teacherMimeType;

  const fileSize =
    side === "student"
      ? question.studentFileSize
      : question.teacherFileSize;

  if (!fileName) {
    throw new Error("Question file is missing");
  }

  const filePath = getQuestionFilePath(question, side);

  res.setHeader(
    "Content-Disposition",
    `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  );

  res.setHeader(
    "Content-Type",
    mimeType || "application/octet-stream",
  );

  if (fileSize) {
    res.setHeader("Content-Length", String(fileSize));
  }

  return res.sendFile(filePath);
}

export function registerMaterialDownloadRoute(app: Express) {

  // VIEW / PREVIEW
  app.get("/api/materials/:id/view", async (req, res) => {
    try {
      const materialId = Number(req.params.id);

      if (!Number.isInteger(materialId) || materialId <= 0) {
        return res.status(400).json({
          error: "Invalid material ID",
        });
      }

      const { material, filePath } =
        await getAuthorizedMaterial(req, materialId);

      res.setHeader(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(material.fileName)}`
      );

      res.setHeader(
        "Content-Type",
        material.mimeType || "application/octet-stream"
      );

      res.setHeader(
        "Content-Length",
        String(material.fileSize)
      );

      return res.sendFile(filePath);
    } catch (error) {
      console.error("Material view error:", error);

      const message =
        error instanceof Error ? error.message : "Unable to view material";

      if (message.includes("Authentication")) {
        return res.status(401).json({ error: message });
      }

      if (
        message.includes("access") ||
        message.includes("Access")
      ) {
        return res.status(403).json({ error: message });
      }

      if (
        message.includes("not found") ||
        message.includes("missing")
      ) {
        return res.status(404).json({ error: message });
      }

      return res.status(500).json({
        error: "Unable to view material",
      });
    }
  });


  // DOWNLOAD
  app.get("/api/materials/:id/download", async (req, res) => {
    try {
      const materialId = Number(req.params.id);

      if (!Number.isInteger(materialId) || materialId <= 0) {
        return res.status(400).json({
          error: "Invalid material ID",
        });
      }

      const { material, filePath } =
        await getAuthorizedMaterial(req, materialId);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(material.fileName)}`
      );

      res.setHeader(
        "Content-Type",
        material.mimeType || "application/octet-stream"
      );

      res.setHeader(
        "Content-Length",
        String(material.fileSize)
      );

      return res.sendFile(filePath);
    } catch (error) {
      console.error("Material download error:", error);

      const message =
        error instanceof Error ? error.message : "Unable to download material";

      if (message.includes("Authentication")) {
        return res.status(401).json({ error: message });
      }

      if (
        message.includes("access") ||
        message.includes("Access")
      ) {
        return res.status(403).json({ error: message });
      }

      if (
        message.includes("not found") ||
        message.includes("missing")
      ) {
        return res.status(404).json({ error: message });
      }

      return res.status(500).json({
        error: "Unable to download material",
      });
    }
  });

  // STUDENT ATTACHMENT — VIEW
  app.get("/api/questions/:id/student-file/view", async (req, res) => {
    try {
      const questionId = Number(req.params.id);

      if (!Number.isInteger(questionId) || questionId <= 0) {
        return res.status(400).json({
          error: "Invalid question ID",
        });
      }

      const { question } = await getAuthorizedQuestion(req, questionId);

      return sendQuestionFile(
        res,
        question,
        "student",
        false,
      );
    } catch (error) {
      console.error("Student question file view error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to view question file";

      if (message.includes("Authentication")) {
        return res.status(401).json({ error: message });
      }

      if (message.includes("access") || message.includes("Access")) {
        return res.status(403).json({ error: message });
      }

      if (
        message.includes("not found") ||
        message.includes("missing")
      ) {
        return res.status(404).json({ error: message });
      }

      return res.status(500).json({
        error: "Unable to view question file",
      });
    }
  });

  // STUDENT ATTACHMENT — DOWNLOAD
  app.get("/api/questions/:id/student-file/download", async (req, res) => {
    try {
      const questionId = Number(req.params.id);

      if (!Number.isInteger(questionId) || questionId <= 0) {
        return res.status(400).json({
          error: "Invalid question ID",
        });
      }

      const { question } = await getAuthorizedQuestion(req, questionId);

      return sendQuestionFile(
        res,
        question,
        "student",
        true,
      );
    } catch (error) {
      console.error("Student question file download error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to download question file";

      if (message.includes("Authentication")) {
        return res.status(401).json({ error: message });
      }

      if (message.includes("access") || message.includes("Access")) {
        return res.status(403).json({ error: message });
      }

      if (
        message.includes("not found") ||
        message.includes("missing")
      ) {
        return res.status(404).json({ error: message });
      }

      return res.status(500).json({
        error: "Unable to download question file",
      });
    }
  });

  // TEACHER ATTACHMENT — VIEW
  app.get("/api/questions/:id/teacher-file/view", async (req, res) => {
    try {
      const questionId = Number(req.params.id);

      if (!Number.isInteger(questionId) || questionId <= 0) {
        return res.status(400).json({
          error: "Invalid question ID",
        });
      }

      const { question } = await getAuthorizedQuestion(req, questionId);

      return sendQuestionFile(
        res,
        question,
        "teacher",
        false,
      );
    } catch (error) {
      console.error("Teacher question file view error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to view teacher file";

      if (message.includes("Authentication")) {
        return res.status(401).json({ error: message });
      }

      if (message.includes("access") || message.includes("Access")) {
        return res.status(403).json({ error: message });
      }

      if (
        message.includes("not found") ||
        message.includes("missing")
      ) {
        return res.status(404).json({ error: message });
      }

      return res.status(500).json({
        error: "Unable to view teacher file",
      });
    }
  });

  // TEACHER ATTACHMENT — DOWNLOAD
  app.get("/api/questions/:id/teacher-file/download", async (req, res) => {
    try {
      const questionId = Number(req.params.id);

      if (!Number.isInteger(questionId) || questionId <= 0) {
        return res.status(400).json({
          error: "Invalid question ID",
        });
      }

      const { question } = await getAuthorizedQuestion(req, questionId);

      return sendQuestionFile(
        res,
        question,
        "teacher",
        true,
      );
    } catch (error) {
      console.error("Teacher question file download error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to download teacher file";

      if (message.includes("Authentication")) {
        return res.status(401).json({ error: message });
      }

      if (message.includes("access") || message.includes("Access")) {
        return res.status(403).json({ error: message });
      }

      if (
        message.includes("not found") ||
        message.includes("missing")
      ) {
        return res.status(404).json({ error: message });
      }

      return res.status(500).json({
        error: "Unable to download teacher file",
      });
    }
  });
}

