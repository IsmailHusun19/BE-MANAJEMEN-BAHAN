import express from "express";
import { prisma } from "../config/database.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

const generateTransaksiId = async () => {
  let id;
  let exists;

  do {
    const random = Math.floor(
      1000 + Math.random() * 9000
    );

    id = `TBM-${random}`;

    exists = await prisma.transaksiBahanMasuk.findUnique({
      where: { id },
    });
  } while (exists);

  return id;
};

const validateTransaksi = (req, res, next) => {
  const { supplier, catatan, tanggalMasuk, bahan } = req.body;

  if (!supplier || supplier.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Supplier wajib diisi",
    });
  }

  if (!tanggalMasuk) {
    return res.status(400).json({
      success: false,
      message: "Tanggal masuk wajib diisi",
    });
  }

  if (!catatan || catatan.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Catatan wajib diisi",
    });
  }

  if (!bahan || !Array.isArray(bahan) || bahan.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Detail bahan wajib diisi",
    });
  }

  for (const item of bahan) {
    if (!item.bahanId) {
      return res.status(400).json({
        success: false,
        message: "Bahan wajib dipilih",
      });
    }

    if (
      item.jumlah === undefined ||
      item.jumlah === null ||
      item.jumlah === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Jumlah wajib diisi",
      });
    }

    if (Number(item.jumlah) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Jumlah harus lebih dari 0",
      });
    }
  }

  next();
};

// ADD TRANSAKSI
router.post("/", auth, validateTransaksi, async (req, res) => {
  try {
    const { supplier, catatan, tanggalMasuk, bahan } = req.body;

    const transaksiId = await generateTransaksiId();

    const result = await prisma.$transaction(async (tx) => {

      const transaksi = await tx.transaksiBahanMasuk.create({
        data: {
          id: transaksiId,
          userId: req.user.id,
          supplier,
          catatan,
          tanggalMasuk,
          konfirmasi: false,
        },
      });

      // CEK DUPLIKAT DALAM REQUEST (pakai name nanti di error)
      const bahanIds = bahan.map((b) => b.bahanId);
      const duplicateInRequest = bahanIds.filter(
        (id, index) => bahanIds.indexOf(id) !== index
      );

      if (duplicateInRequest.length > 0) {

        // ambil nama bahan untuk display
        const bahanList = await tx.bahan.findMany({
          where: {
            id: { in: [...new Set(duplicateInRequest)] },
          },
        });

        const namaBahan = bahanList.map((b) => b.name).join(", ");

        throw new Error(
          `Bahan ${namaBahan} sudah ada dalam transaksi ini`
        );
      }

      for (const item of bahan) {

        const bahanData = await tx.bahan.findFirst({
          where: {
            id: item.bahanId,
            isActive: true,
          },
        });

        if (!bahanData) {
          throw new Error(
            `Bahan ${item.bahanId} tidak ditemukan`
          );
        }

        const existing = await tx.bahanMasuk.findFirst({
          where: {
            transaksiId: transaksi.id,
            bahanId: item.bahanId,
          },
        });

        if (existing) {
          throw new Error(
            `Bahan ${bahanData.name} sudah ada dalam transaksi ini`
          );
        }

        await tx.bahanMasuk.create({
          data: {
            transaksiId: transaksi.id,
            bahanId: item.bahanId,
            jumlah: Number(item.jumlah),
          },
        });
      }

      return transaksi;
    });

    res.status(201).json({
      success: true,
      message: "Transaksi bahan masuk berhasil dibuat",
      data: result,
    });

  } catch (err) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// GET ALL TRANSAKSI
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereFilter =
      startDate && endDate
        ? {
            tanggalMasuk: {
              gte: new Date(`${startDate}T00:00:00.000Z`),
              lte: new Date(`${endDate}T23:59:59.999Z`),
            },
          }
        : {};

    const transaksi = await prisma.transaksiBahanMasuk.findMany({
      where: whereFilter,

      include: {
        user: {
          select: {
            id: true,
            nik: true,
            name: true,
            role: true,
          },
        },

        bahanMasuk: {
          include: {
            bahan: true,
          },
        },
      },

      orderBy: {
        tanggalMasuk: "desc",
      },
    });

    res.json({
      success: true,
      data: transaksi,
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// PUT STATUS KONFIRMASI TRANSAKSI
router.put("/konfirmasi/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.$transaction(async (tx) => {

      const transaksi =
        await tx.transaksiBahanMasuk.findUnique({
          where: {
            id,
          },

          include: {
            user: {
              select: {
                id: true,
                nik: true,
                name: true,
                role: true,
              },
            },

            bahanMasuk: {
              include: {
                bahan: true,
              },
            },
          },
        });

      if (!transaksi) {
        throw new Error(
          "Transaksi tidak ditemukan"
        );
      }
      const newKonfirmasi =
        !transaksi.konfirmasi;
      for (const item of transaksi.bahanMasuk) {

        await tx.bahan.update({
          where: {
            id: item.bahanId,
          },

          data: {
            stok: newKonfirmasi
              ? {
                  increment: Number(item.jumlah),
                }
              : {
                  decrement: Number(item.jumlah),
                },
          },
        });
      }
      const updatedTransaksi =
        await tx.transaksiBahanMasuk.update({
          where: {
            id,
          },

          data: {
            konfirmasi: newKonfirmasi,
          },

          include: {
            user: {
              select: {
                id: true,
                nik: true,
                name: true,
                role: true,
              },
            },

            bahanMasuk: {
              include: {
                bahan: true,
              },
            },
          },
        });

      return updatedTransaksi;
    });

    res.json({
      success: true,
      message: result.konfirmasi
        ? "Transaksi berhasil dikonfirmasi"
        : "Konfirmasi transaksi dibatalkan",
      data: result,
    });

  } catch (err) {

    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// GET DETAIL TRANSAKSI
router.get("/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;

    const transaksi =
      await prisma.transaksiBahanMasuk.findUnique({
        where: { id },

        include: {
          user: {
            select: {
              id: true,
              nik: true,
              name: true,
              role: true,
            },
          },

          bahanMasuk: {
            include: {
              bahan: true,
            },
          },
        },
      });

    if (!transaksi) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: transaksi,
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

//  UPDATE TRANSAKSI
router.put("/:id", auth, validateTransaksi, async (req, res) => {
  try {

    const id = req.params.id;
    const { supplier, catatan, bahan } = req.body;

    const result = await prisma.$transaction(async (tx) => {

      const transaksi = await tx.transaksiBahanMasuk.findUnique({
        where: { id },
        include: {
          bahanMasuk: true,
        },
      });

      if (!transaksi) {
        throw new Error("Transaksi tidak ditemukan");
      }

      // =========================
      // 1. BALIKKAN STOK JIKA SUDAH KONFIRM
      // =========================
      if (transaksi.konfirmasi) {
        for (const item of transaksi.bahanMasuk) {
          await tx.bahan.update({
            where: { id: item.bahanId },
            data: {
              stok: {
                decrement: Number(item.jumlah),
              },
            },
          });
        }
      }

      // =========================
      // 2. HAPUS DETAIL LAMA
      // =========================
      await tx.bahanMasuk.deleteMany({
        where: { transaksiId: id },
      });

      // =========================
      // 3. UPDATE HEADER
      // =========================
      await tx.transaksiBahanMasuk.update({
        where: { id },
        data: { supplier, catatan },
      });

      // =========================
      // 4. CEK DUPLIKAT DALAM REQUEST
      // =========================
      const bahanIds = bahan.map((b) => b.bahanId);

      const duplicateIds = bahanIds.filter(
        (v, i) => bahanIds.indexOf(v) !== i
      );

      if (duplicateIds.length > 0) {
        const bahanList = await tx.bahan.findMany({
          where: {
            id: { in: [...new Set(duplicateIds)] },
          },
        });

        const namaBahan = bahanList.map((b) => b.name).join(", ");

        throw new Error(
          `Bahan ${namaBahan} sudah ada dalam transaksi ini`
        );
      }

      // =========================
      // 5. INSERT DETAIL BARU
      // =========================
      for (const item of bahan) {

        const bahanData = await tx.bahan.findFirst({
          where: {
            id: item.bahanId,
            isActive: true,
          },
        });

        if (!bahanData) {
          throw new Error(
            `Bahan ${item.bahanId} tidak ditemukan`
          );
        }

        // insert detail
        await tx.bahanMasuk.create({
          data: {
            transaksiId: id,
            bahanId: item.bahanId,
            jumlah: Number(item.jumlah),
          },
        });

        // =========================
        // 6. RE-CALC STOK JIKA KONFIRM
        // =========================
        if (transaksi.konfirmasi) {
          await tx.bahan.update({
            where: { id: item.bahanId },
            data: {
              stok: {
                increment: Number(item.jumlah),
              },
            },
          });
        }
      }

      return true;
    });

    res.json({
      success: true,
      message: "Transaksi berhasil diperbarui",
      data: result,
    });

  } catch (err) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// HAPUS TRANSAKSI BAHAN MASUK
router.delete("/:id", auth, async (req, res) => {
  try {

    const id = req.params.id;

    await prisma.$transaction(async (tx) => {
      const transaksi =
        await tx.transaksiBahanMasuk.findUnique({
          where: {
            id,
          },

          include: {
            bahanMasuk: {
              include: {
                bahan: true,
              },
            },
          },
        });

      if (!transaksi) {
        throw new Error(
          "Transaksi tidak ditemukan"
        );
      }
      if (transaksi.konfirmasi) {

        for (const item of transaksi.bahanMasuk) {

          const stokSekarang =
            Number(item.bahan.stok);

          const jumlahRollback =
            Number(item.jumlah);
          if (stokSekarang < jumlahRollback) {
            throw new Error(
              `Stok ${item.bahan.name} tidak cukup untuk menghapus transaksi`
            );
          }
          await tx.bahan.update({
            where: {
              id: item.bahanId,
            },

            data: {
              stok: {
                decrement: jumlahRollback,
              },
            },
          });
        }
      }
      await tx.bahanMasuk.deleteMany({
        where: {
          transaksiId: id,
        },
      });
      await tx.transaksiBahanMasuk.delete({
        where: {
          id,
        },
      });
    });

    res.json({
      success: true,
      message: "Transaksi berhasil dihapus",
    });

  } catch (err) {

    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;