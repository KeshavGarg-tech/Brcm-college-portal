import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const uploadDir = path.resolve(process.cwd(), "server/uploads/materials");

export async function saveMaterialFile(
  fileName: string,
  data: Buffer,
): Promise<{ storageKey: string; fileUrl: string }> {
  await fs.mkdir(uploadDir, { recursive: true });

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${crypto.randomUUID()}-${safeName}`;

  const filePath = path.join(uploadDir, uniqueName);

  await fs.writeFile(filePath, data);

  return {
    storageKey: uniqueName,
    fileUrl: `/uploads/materials/${encodeURIComponent(uniqueName)}`,
  };
}


export async function saveQuestionFile(
  fileName: string,
  data: Buffer,
): Promise<{ storageKey: string; fileUrl: string }> {
  const questionUploadDir = path.resolve(
    process.cwd(),
    "server/uploads/questions",
  );

  await fs.mkdir(questionUploadDir, { recursive: true });

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${crypto.randomUUID()}-${safeName}`;
  const filePath = path.join(questionUploadDir, uniqueName);

  await fs.writeFile(filePath, data);

  return {
    storageKey: uniqueName,
    fileUrl: `/uploads/questions/${encodeURIComponent(uniqueName)}`,
  };
}


export async function saveSubmissionFile(
  fileName: string,
  data: Buffer,
): Promise<{ storageKey: string; fileUrl: string }> {
  const submissionUploadDir = path.resolve(
    process.cwd(),
    "server/uploads/submissions",
  );

  await fs.mkdir(submissionUploadDir, { recursive: true });

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${crypto.randomUUID()}-${safeName}`;
  const filePath = path.join(submissionUploadDir, uniqueName);

  await fs.writeFile(filePath, data);

  return {
    storageKey: uniqueName,
    fileUrl: `/uploads/submissions/${encodeURIComponent(uniqueName)}`,
  };
}

export async function deleteSubmissionFile(storageKey: string): Promise<void> {
  const submissionUploadDir = path.resolve(
    process.cwd(),
    "server/uploads/submissions",
  );

  const safeKey = path.basename(storageKey);
  const filePath = path.join(submissionUploadDir, safeKey);

  await fs.rm(filePath, { force: true });
}

export async function deleteQuestionFile(storageKey: string): Promise<void> {
  const questionUploadDir = path.resolve(
    process.cwd(),
    "server/uploads/questions",
  );

  const safeKey = path.basename(storageKey);
  const filePath = path.join(questionUploadDir, safeKey);

  await fs.rm(filePath, { force: true });
}

export async function deleteMaterialFile(storageKey: string): Promise<void> {
  const safeKey = path.basename(storageKey);
  const filePath = path.join(uploadDir, safeKey);

  await fs.rm(filePath, { force: true });
}
