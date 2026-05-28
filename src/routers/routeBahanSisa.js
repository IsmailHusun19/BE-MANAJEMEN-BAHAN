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

    id = `BHNS-${random}`;

    exists =
      await prisma.transaksiBahanSisa.findUnique({
        where: { id },
      });

  } while (exists);

  return id;
};

const validateTransaksi = (req, res, next) => {

  const { detailBahan } = req.body;

  if (
    !detailBahan ||
    !Array.isArray(detailBahan) ||
    detailBahan.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Detail bahan wajib diisi",
    });
  }

  for (const item of detailBahan) {

    if (
      !item.bahanId ||
      item.jumlahDipakai == null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Bahan dan jumlah dipakai wajib diisi",
      });
    }

    if (Number(item.jumlahDipakai) <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Jumlah dipakai harus lebih dari 0",
      });
    }

    if (
      Number(item.jumlahSisa || 0) >
      Number(item.jumlahDipakai)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Jumlah sisa tidak boleh lebih besar dari jumlah dipakai",
      });
    }
  }

  next();
};

// CREATE TRANSAKSI
router.post( "/", auth, validateTransaksi, async (req, res) => {
    try {

      const { catatan, detailBahan } = req.body;

      const transaksi = await prisma.$transaction(async (tx) => {
        const transaksiId = await generateTransaksiId();
        const header = await tx.transaksiBahanSisa.create({
          data: {
            id: transaksiId,
            userId: req.user.id,
            catatan,
            status: "PENDING",
          },
        });
        const bahanIds = detailBahan.map((b) => b.bahanId);

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
        for (const item of detailBahan) {

          const jumlahDipakai = Number(item.jumlahDipakai);
          const jumlahSisa = Number(item.jumlahSisa || 0);

          const bahan = await tx.bahan.findFirst({
            where: {
              id: item.bahanId,
              isActive: true,
            },
          });

          if (!bahan) {
            throw new Error(
              `Bahan ${item.bahanId} tidak ditemukan`
            );
          }
          const kebutuhan = jumlahDipakai - jumlahSisa;

          if (kebutuhan > bahan.stok) {
            throw new Error(
              `Stok ${bahan.name} tidak mencukupi`
            );
          }

          await tx.bahanSisa.create({
            data: {
              transaksiId: header.id,
              bahanId: item.bahanId,
              jumlahDipakai,
              jumlahSisa,
            },
          });
        }

        return header;
      });

      res.status(201).json({
        success: true,
        message: "Transaksi bahan produksi berhasil dibuat",
        data: transaksi,
      });

    } catch (err) {
      console.error(err);

      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// GET ALL
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: new Date(`${startDate}T00:00:00.000Z`),
              lte: new Date(`${endDate}T23:59:59.999Z`),
            },
          }
        : {};

    const transaksi = await prisma.transaksiBahanSisa.findMany({
      where: dateFilter,

      include: {
        user: {
          select: {
            id: true,
            nik: true,
            name: true,
            role: true,
          },
        },

        detailBahanSisa: {
          include: {
            bahan: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
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

// GET DETAIL
router.get("/:id", auth, async (req, res) => {

  try {

    const id = req.params.id;

    const transaksi =
      await prisma.transaksiBahanSisa.findUnique({
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

          detailBahanSisa: {
            include: {
              bahan: true,
            },
          },
        },
      });

    if (!transaksi) {
      return res.status(404).json({
        success: false,
        message:
          "Transaksi tidak ditemukan",
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

// UPDATE TRANSAKSI
router.put("/:id", auth, validateTransaksi, async (req, res) => {

  try {

    const id = req.params.id;
    const { catatan, detailBahan } = req.body;

    const transaksi = await prisma.transaksiBahanSisa.findUnique({
      where: { id },
    });

    if (!transaksi) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
      });
    }

    if (transaksi.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Transaksi yang sudah diproses tidak bisa diedit",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaksiBahanSisa.update({
        where: { id },
        data: { catatan },
      });
      await tx.bahanSisa.deleteMany({
        where: { transaksiId: id },
      });
      const bahanIds = detailBahan.map((b) => b.bahanId);

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
      for (const item of detailBahan) {

        const jumlahDipakai = Number(item.jumlahDipakai);
        const jumlahSisa = Number(item.jumlahSisa || 0);

        const bahan = await tx.bahan.findFirst({
          where: {
            id: item.bahanId,
            isActive: true,
          },
        });

        if (!bahan) {
          throw new Error(
            `Bahan ${item.bahanId} tidak ditemukan`
          );
        }

        const kebutuhan = jumlahDipakai - jumlahSisa;

        if (kebutuhan > bahan.stok) {
          throw new Error(
            `Stok ${bahan.name} tidak mencukupi`
          );
        }

        await tx.bahanSisa.create({
          data: {
            transaksiId: id,
            bahanId: item.bahanId,
            jumlahDipakai,
            jumlahSisa,
          },
        });
      }

    });

    res.json({
      success: true,
      message: "Transaksi berhasil diperbarui",
    });

  } catch (err) {

    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// UPDATE STATUS TRANSAKSI (APPROVE / REJECT / PENDING)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const id = req.params.id;

    const { status } = req.body;
    const allowedStatus = [
      "PENDING",
      "DISETUJUI",
      "DITOLAK",
    ];

    if (!allowedStatus.includes(status)) {
      throw new Error("Status tidak valid");
    }

    await prisma.$transaction(async (tx) => {
      const transaksi =
        await tx.transaksiBahanSisa.findUnique({
          where: { id },

          include: {
            detailBahanSisa: {
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

      const currentStatus =
        transaksi.status;

      if (currentStatus === status) {
        throw new Error(
          `Transaksi sudah berstatus ${status}`
        );
      }

      if (
        currentStatus === "DISETUJUI"
      ) {
        for (const item of transaksi.detailBahanSisa) {
          const kebutuhan =
            item.jumlahDipakai -
            item.jumlahSisa;

          await tx.bahan.update({
            where: {
              id: item.bahanId,
            },

            data: {
              stok: {
                increment: kebutuhan,
              },
            },
          });
        }
      }

      if (status === "DISETUJUI") {
        for (const item of transaksi.detailBahanSisa) {
          const kebutuhan =
            item.jumlahDipakai -
            item.jumlahSisa;

          if (kebutuhan > item.bahan.stok) {
            throw new Error(
              `Stok ${item.bahan.name} tidak mencukupi`
            );
          }
        }
        for (const item of transaksi.detailBahanSisa) {
          const kebutuhan =
            item.jumlahDipakai -
            item.jumlahSisa;

          await tx.bahan.update({
            where: {
              id: item.bahanId,
            },

            data: {
              stok: {
                decrement: kebutuhan,
              },
            },
          });
        }
      }
      await tx.transaksiBahanSisa.update({
        where: { id },

        data: {
          status,
        },
      });
    });

    res.json({
      success: true,
      message:
        status === "DISETUJUI"
          ? "Transaksi berhasil disetujui"
          : status === "DITOLAK"
          ? "Transaksi berhasil ditolak"
          : "Status transaksi berhasil diubah",
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// DELETE TRANSAKSI
router.delete("/:id", auth, async (req, res) => {

  try {

    const id = req.params.id;

    const transaksi =
      await prisma.transaksiBahanSisa.findUnique({
        where: { id },
      });

    if (!transaksi) {
      return res.status(404).json({
        success: false,
        message:
          "Transaksi tidak ditemukan",
      });
    }

    if (
      transaksi.status !== "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Transaksi yang sudah diproses tidak bisa dihapus",
      });
    }

    await prisma.$transaction(async (tx) => {

      await tx.bahanSisa.deleteMany({
        where: {
          transaksiId: id,
        },
      });

      await tx.transaksiBahanSisa.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message:
        "Transaksi berhasil dihapus",
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