import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { auth } from "../middlewares/auth.js";
import { generateToken } from "../config/jwt.js";
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();
    cb(null, `avatar_${req.user.id}_${Date.now()}.${ext}`);
  },
});

const upload = multer({ storage });

const generateNIK = async () => {
  let nik;
  let exists;

  do {
    nik = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digit
    exists = await prisma.users.findUnique({ where: { nik } });
  } while (exists);

  return nik;
};

const validateUser = (req, res, next) => {
  const { nik, name, email, password, role } = req.body;

  if ( !name || !email || !password || !role) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  next();
};

// Get current logged-in user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nik: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email tidak ditemukan",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Akun sudah tidak aktif. Silakan hubungi Owner.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Password salah",
      });
    }

    const token = generateToken({
      id: user.id,
      nik: user.nik,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        nik: user.nik,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});

// Get user
router.get("/", auth, async (req, res) => {
  const users = await prisma.users.findMany({
    select: { id: true, nik: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json({ message: "success", data: users });
});

// Get all user
router.get("/all", auth, async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      where: {
        NOT: {
          role: "OWNER",
        },
      },
      select: { id: true, nik: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    res.json({ message: "success", data: users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get user by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, nik: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({ message: "success", data: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Daftar akun
router.post("/", auth, validateUser, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exist = await prisma.users.findUnique({ where: { email } });
    if (exist) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const nik = await generateNIK();
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        nik,
        email,
        password: hashed,
        role,
      },
      select: {
        id: true,
        nik: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "User berhasil dibuat",
      data: user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// update akun me
router.put("/me", auth, upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.user.id;
    let data = req.body || {};

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    if (req.file) {
      data.avatar = req.file.path.replace(/\\/g, "/");
    }

    const user = await prisma.users.update({
      where: { id: Number(userId) },
      data,
      select: { id: true, nik: true, name: true, email: true, role: true, avatar: true },
    });

    res.json({ message: "Akun berhasil diperbarui", data: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Nonaktifkan akun
router.patch("/nonaktif/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "ID tidak valid",
      });
    }

    const user = await prisma.users.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    res.json({
      message: "Akun berhasil dinonaktifkan",
      data: user,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

// Aktifkan akun
router.patch("/restore/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "ID tidak valid",
      });
    }

    const user = await prisma.users.update({
      where: { id },
      data: {
        isActive: true,
      },
    });

    res.json({
      message: "Akun berhasil diaktifkan",
      data: user,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

// Edit aKun
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    let data = req.body;

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.users.update({
      where: { id: Number(id) },
      data,
      select: { id: true, nik: true, name: true, email: true, role: true },
    });

    res.json({ message: "User diperbarui", data: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete akun
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID tidak valid",
      });
    }

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        nik: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    await prisma.$transaction(async (tx) => {
      const transaksiBahanMasuk = await tx.transaksiBahanMasuk.findMany({
        where: { userId: id },
        select: { id: true },
      });

      const transaksiBahanSisa = await tx.transaksiBahanSisa.findMany({
        where: { userId: id },
        select: { id: true },
      });

      const transaksiBahanMasukIds = transaksiBahanMasuk.map(
        (item) => item.id
      );

      const transaksiBahanSisaIds = transaksiBahanSisa.map(
        (item) => item.id
      );

      await tx.bahanMasuk.deleteMany({
        where: {
          transaksiId: {
            in: transaksiBahanMasukIds,
          },
        },
      });

      await tx.bahanSisa.deleteMany({
        where: {
          transaksiId: {
            in: transaksiBahanSisaIds,
          },
        },
      });

      await tx.transaksiBahanMasuk.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.transaksiBahanSisa.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.users.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message: "User dan seluruh relasinya berhasil dihapus permanent",
      data: user,
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.json({ message: "Logout berhasil" });
});


export default router;
