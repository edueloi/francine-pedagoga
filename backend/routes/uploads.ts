import express from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
router.use(authMiddleware);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Allowlist of upload categories -> subfolder under uploads/ + accepted mimetypes.
// Reject anything outside this list with 400 to avoid arbitrary folder creation
// or accepting unexpected file types.
const CATEGORY_CONFIG: Record<string, { allowedMimeTypes: string[] }> = {
  clinic: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  documents: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
  avatars: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
};

const uploadsRoot = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const category = req.params.category;
    const destDir = path.join(uploadsRoot, category);
    fs.mkdirSync(destDir, { recursive: true });
    cb(null, destDir);
  },
  filename: (_req, file, cb) => {
    // Random unique name preserving the original extension — avoids collisions
    // and path traversal from user-supplied filenames.
    const ext = path.extname(file.originalname);
    const randomName = crypto.randomBytes(16).toString("hex");
    cb(null, `${randomName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const category = req.params.category;
    const config = CATEGORY_CONFIG[category];
    if (!config) {
      // Category itself is validated separately before hitting multer, but guard here too.
      return cb(new Error("Categoria de upload inválida"));
    }
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Tipo de arquivo não permitido"));
    }
    cb(null, true);
  },
});

// POST /:category -> upload a single file into uploads/<category>/
router.post("/:category", (req, res) => {
  const { category } = req.params;
  if (!CATEGORY_CONFIG[category]) {
    return res.status(400).json({ error: "Categoria de upload inválida" });
  }

  upload.single("file")(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Arquivo excede o tamanho máximo de 5MB" });
      }
      return res.status(400).json({ error: "Falha no upload do arquivo" });
    }
    if (err) {
      return res.status(400).json({ error: err.message || "Tipo de arquivo não permitido" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const url = `/uploads/${category}/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

export default router;
