import express from "express";
import { prisma } from "../config/database.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

const generateBahanId = async () => {
    let id;
    let exists;
  
    do {
      const random = Math.floor(
        1000 + Math.random() * 9000
      );
  
      id = `BHN-${random}`;
  
      exists = await prisma.bahan.findUnique({
        where: { id },
      });
    } while (exists);
  
    return id;
};

const validateBahan = async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body)
      ? req.body
      : req.body
      ? [req.body]
      : [];

    if (!payload.length) {
      return res.status(400).json({
        success: false,
        message: "Request body kosong",
      });
    }

    for (const item of payload) {
      if (!item || typeof item !== "object") {
        return res.status(400).json({
          success: false,
          message: "Format data tidak valid",
        });
      }

      const { name, stok, jumlahMinimum, satuan } = item;

      if (!name || stok === undefined || jumlahMinimum === undefined || !satuan) {
        return res.status(400).json({
          success: false,
          message: "Semua field wajib diisi",
        });
      }

      if (Number(stok) < 0) {
        return res.status(400).json({
          success: false,
          message: "Stok tidak boleh minus",
        });
      }

      if (Number(jumlahMinimum) < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum stok tidak boleh minus",
        });
      }

      // normalize
      item.name = name.trim().toLowerCase();
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const validateBahanUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of payload) {
      const { name, stok, jumlahMinimum, satuan } = item;

      // FIELD WAJIB
      if (!name || stok === undefined || jumlahMinimum === undefined || !satuan) {
        return res.status(400).json({
          success: false,
          message: "Semua field wajib diisi",
        });
      }

      const cleanName = name.trim().toLowerCase();
      const exist = await prisma.bahan.findFirst({
        where: { name: cleanName },
      });

      if (exist && exist.id !== id) {
        return res.status(400).json({
          success: false,
          message: `Nama bahan "${name}" sudah digunakan`,
        });
      }

      // VALIDASI ANGKA
      if (Number(stok) < 0) {
        return res.status(400).json({
          success: false,
          message: `Stok "${name}" tidak boleh minus`,
        });
      }

      if (Number(jumlahMinimum) < 0) {
        return res.status(400).json({
          success: false,
          message: `Minimum "${name}" tidak boleh minus`,
        });
      }

      item.name = cleanName;
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

router.post("/", auth, validateBahan, async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    const result = [];

    for (const item of payload) {
      const { name, stok, jumlahMinimum, satuan } = item;

      const exist = await prisma.bahan.findFirst({
        where: { name },
      });

      // =========================
      // CASE 1: EXIST & ACTIVE
      // =========================
      if (exist && exist.isActive) {
        result.push({
          name,
          success: false,
          message: `Nama bahan "${name}" sudah digunakan`,
        });
        continue;
      }

      // =========================
      // CASE 2: EXIST BUT INACTIVE → REACTIVATE
      // =========================
      if (exist && !exist.isActive) {
        const updated = await prisma.bahan.update({
          where: { id: exist.id },
          data: {
            stok: Number(stok),
            jumlahMinimum: Number(jumlahMinimum),
            satuan,
            isActive: true,
            name,
          },
        });

        result.push({
          name,
          success: true,
          message: `Bahan "${name}" berhasil diaktifkan kembali`,
          data: updated,
        });

        continue;
      }

      // =========================
      // CASE 3: CREATE NEW
      // =========================
      const id = await generateBahanId();

      const created = await prisma.bahan.create({
        data: {
          id,
          name,
          stok: Number(stok),
          jumlahMinimum: Number(jumlahMinimum),
          satuan,
          isActive: true,
        },
      });

      result.push({
        name,
        success: true,
        message: "Bahan berhasil ditambahkan",
        data: created,
      });
    }

    const hasError = result.some((r) => r.success === false);

    return res.status(hasError ? 400 : 201).json({
      success: !hasError,
      total: result.length,
      data: result,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Nama bahan sudah digunakan",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});

router.get("/", auth, async (req, res) => {
    try {
      const bahan = await prisma.bahan.findMany({
        where: {
          isActive: true,
        },
  
        orderBy: {
          createdAt: "desc",
        },
      });
  
      res.json({
        success: true,
        data: bahan,
      });
    } catch (err) {
      console.error(err);
  
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
});

router.get("/inactive", auth, async (req, res) => {
  try {
    const bahan = await prisma.bahan.findMany({
      where: {
        isActive: false,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: bahan,
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

  
router.get("/:id", auth, async (req, res) => {
    try {
      const id = req.params.id;
  
      const bahan = await prisma.bahan.findFirst({
        where: {
          id,
          isActive: true,
        },
      });
  
      if (!bahan) {
        return res.status(404).json({
          success: false,
          message: "Bahan tidak ditemukan",
        });
      }
  
      res.json({
        success: true,
        data: bahan,
      });
    } catch (err) {
      console.error(err);
  
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
});
  
router.put("/:id", auth, validateBahanUpdate, async (req, res) => {
    try {
      const id = req.params.id;
  
      const { name, stok, jumlahMinimum, satuan } = req.body;
  
      const bahan = await prisma.bahan.findUnique({
        where: { id },
      });
  
      if (!bahan) {
        return res.status(404).json({
          success: false,
          message: "Bahan tidak ditemukan",
        });
      }
  
      const checkName = await prisma.bahan.findFirst({
        where: {
          name,
          NOT: {
            id,
          },
        },
      });
  
      const updateBahan = await prisma.bahan.update({
        where: { id },
  
        data: {
          name,
          stok: Number(stok),
          jumlahMinimum: Number(jumlahMinimum),
          satuan,
        },
      });
  
      res.json({
        success: true,
        message: "Bahan berhasil diperbarui",
        data: updateBahan,
      });
    } catch (err) {
      console.error(err);
  
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
});

router.delete("/inactive/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const bahan = await prisma.bahan.findUnique({
      where: { id },
    });

    if (!bahan) {
      return res.status(404).json({
        success: false,
        message: "Bahan tidak ditemukan",
      });
    }

    const deleted = await prisma.bahan.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return res.json({
      success: true,
      message: "Bahan berhasil dinonaktifkan",
      data: deleted,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
})

router.delete("/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;

    const bahan = await prisma.bahan.findUnique({
      where: { id },
    });

    if (!bahan) {
      return res.status(404).json({
        success: false,
        message: "Bahan tidak ditemukan",
      });
    }

    await prisma.$transaction(async (tx) => {
      const bahanMasukList = await tx.bahanMasuk.findMany({
        where: { bahanId: id },
        select: {
          transaksiId: true,
        },
      });

      const bahanSisaList = await tx.bahanSisa.findMany({
        where: { bahanId: id },
        select: {
          transaksiId: true,
        },
      });

      const transaksiBahanMasukIds = [
        ...new Set(bahanMasukList.map((item) => item.transaksiId)),
      ];

      const transaksiBahanSisaIds = [
        ...new Set(bahanSisaList.map((item) => item.transaksiId)),
      ];

      await tx.bahanMasuk.deleteMany({
        where: { bahanId: id },
      });

      await tx.bahanSisa.deleteMany({
        where: { bahanId: id },
      });

      for (const transaksiId of transaksiBahanMasukIds) {
        const sisaBahanMasuk = await tx.bahanMasuk.count({
          where: { transaksiId },
        });

        if (sisaBahanMasuk === 0) {
          await tx.transaksiBahanMasuk.delete({
            where: { id: transaksiId },
          });
        }
      }

      for (const transaksiId of transaksiBahanSisaIds) {
        const sisaBahanSisa = await tx.bahanSisa.count({
          where: { transaksiId },
        });

        if (sisaBahanSisa === 0) {
          await tx.transaksiBahanSisa.delete({
            where: { id: transaksiId },
          });
        }
      }

      await tx.bahan.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message: "Bahan berhasil dihapus permanent",
      data: bahan,
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

router.patch("/restore/:id", auth, async (req, res) => {
    try {
      const { id } = req.params;
  
      const bahan = await prisma.bahan.findUnique({
        where: { id },
      });
  
      if (!bahan) {
        return res.status(404).json({
          success: false,
          message: "Bahan tidak ditemukan",
        });
      }
  
      const restored = await prisma.bahan.update({
        where: { id },
        data: {
          isActive: true,
        },
      });
  
      return res.json({
        success: true,
        message: "Bahan berhasil diaktifkan kembali",
        data: restored,
      });
    } catch (err) {
      console.error(err);
  
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
});

export default router;