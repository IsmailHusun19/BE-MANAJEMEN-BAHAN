import express from "express";
import { prisma } from "../config/database.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const getStatusType = (status) => {
  if (status === "DISETUJUI") return "success";
  if (status === "DITOLAK") return "warning";
  return "muted";
};

router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilterMasuk =
      startDate && endDate
        ? {
            tanggalMasuk: {
              gte: new Date(`${startDate}T00:00:00.000Z`),
              lte: new Date(`${endDate}T23:59:59.999Z`),
            },
          }
        : {};

    const dateFilterSisa =
      startDate && endDate
        ? {
            createdAt: {
              gte: new Date(`${startDate}T00:00:00.000Z`),
              lte: new Date(`${endDate}T23:59:59.999Z`),
            },
          }
        : {};

    const [
      transaksiMasuk,
      bahanSisa,
      totalStok,
      stockMenipis,
      lowStock,
      recentMasuk,
      recentSisa,
    ] = await Promise.all([
      prisma.transaksiBahanMasuk.findMany({
        where: dateFilterMasuk,
        select: {
          tanggalMasuk: true,
          createdAt: true,
          konfirmasi: true,
          bahanMasuk: {
            include: {
              bahan: true,
            },
          },
        },
      }),

      prisma.bahanSisa.findMany({
        where: dateFilterSisa,
        include: {
          bahan: true,
        },
      }),

      prisma.bahan.aggregate({
        where: {
          isActive: true,
        },
        _sum: {
          stok: true,
        },
      }),

      prisma.bahan.count({
        where: {
          isActive: true,
          stok: {
            lte: prisma.bahan.fields.jumlahMinimum,
          },
        },
      }),

      prisma.bahan.findMany({
        where: {
          isActive: true,
          stok: {
            lte: prisma.bahan.fields.jumlahMinimum,
          },
        },
        orderBy: {
          stok: "asc",
        },
        take: 5,
      }),

      prisma.transaksiBahanMasuk.findMany({
        where: dateFilterMasuk,
        take: 5,
        orderBy: {
          tanggalMasuk: "desc",
        },
        include: {
          user: true,
          bahanMasuk: {
            include: {
              bahan: true,
            },
          },
        },
      }),

      prisma.transaksiBahanSisa.findMany({
        where: dateFilterSisa,
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          detailBahanSisa: {
            include: {
              bahan: true,
            },
          },
        },
      }),
    ]);

    const totalMasuk = transaksiMasuk.reduce((acc, trx) => {
      const total = trx.bahanMasuk.reduce(
        (sum, item) => sum + Number(item.jumlah || 0),
        0
      );

      return acc + total;
    }, 0);

    const totalDipakai = bahanSisa.reduce(
      (acc, item) => acc + Number(item.jumlahDipakai || 0),
      0
    );

    const weeklyTotal = Array(7).fill(0);
    const monthlyTotal = Array(12).fill(0);
    const yearlyGroup = {};

    transaksiMasuk
    .filter((trx) => trx.konfirmasi === true)
    .forEach((trx) => {
      const trxDate = new Date(trx.tanggalMasuk);
  
      const dayIndex = trxDate.getDay();
      const monthIndex = trxDate.getMonth();
      const year = trxDate.getFullYear();
  
      const total = trx.bahanMasuk.reduce(
        (acc, item) => acc + Number(item.jumlah || 0),
        0
      );
  
      weeklyTotal[dayIndex] += total;
      monthlyTotal[monthIndex] += total;
  
      if (!yearlyGroup[year]) {
        yearlyGroup[year] = 0;
      }
  
      yearlyGroup[year] += total;
    });

    const weekly = weeklyTotal.map((value, index) => ({
      label: dayLabels[index],
      value,
    }));

    const monthly = monthlyTotal.map((value, index) => ({
      label: monthLabels[index],
      value,
    }));

    const currentYear = new Date().getFullYear();

    const yearly = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i).map(
      (year) => ({
        label: String(year),
        value: yearlyGroup[year] || 0,
      })
    );

    const usageGroup = {};

    bahanSisa.forEach((item) => {
      const bahanName = item.bahan?.name || "Tidak diketahui";

      if (!usageGroup[bahanName]) {
        usageGroup[bahanName] = 0;
      }

      usageGroup[bahanName] += Number(item.jumlahDipakai || 0);
    });

    const totalUsage = Object.values(usageGroup).reduce(
      (acc, value) => acc + value,
      0
    );

    let materialUsage = Object.entries(usageGroup)
      .map(([name, jumlah]) => ({
        name,
        jumlah,
        value: totalUsage
          ? Number(((jumlah / totalUsage) * 100).toFixed(1))
          : 0,
      }))
      .sort((a, b) => b.jumlah - a.jumlah);

    if (materialUsage.length > 5) {
      const topFive = materialUsage.slice(0, 5);
      const otherItems = materialUsage.slice(5);

      const otherJumlah = otherItems.reduce(
        (acc, item) => acc + Number(item.jumlah || 0),
        0
      );

      const otherValue = totalUsage
        ? Number(((otherJumlah / totalUsage) * 100).toFixed(1))
        : 0;

      topFive.push({
        name: "Lainnya",
        jumlah: otherJumlah,
        value: otherValue,
      });

      materialUsage = topFive;
    }

    const lowStockData = lowStock.map((bahan) => ({
      name: bahan.name,
      qty: `${bahan.stok} ${bahan.satuan}`,
      threshold: `${bahan.jumlahMinimum} ${bahan.satuan}`,
      pct:
        bahan.jumlahMinimum > 0
          ? Math.round((bahan.stok / bahan.jumlahMinimum) * 100)
          : 0,
    }));

    const activities = [
      ...recentMasuk.map((trx) => ({
        text: `${trx.user.name} menambahkan bahan masuk`,
        time: trx.tanggalMasuk,
        type: trx.konfirmasi ? "success" : "info",
      })),

      ...recentSisa.map((trx) => ({
        text: `${trx.user.name} melakukan pemakaian bahan`,
        time: trx.createdAt,
        type: getStatusType(trx.status),
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    const masukTransactions = recentMasuk.flatMap((trx) =>
      trx.bahanMasuk.map((item) => ({
        bahan: item.bahan.name,
        jenis: "Masuk",
        jumlah: `${item.jumlah} ${item.bahan.satuan}`,
        tanggal: trx.tanggalMasuk,
        status: trx.konfirmasi ? "Selesai" : "Pending",
        statusType: trx.konfirmasi ? "success" : "warning",
      }))
    );

    const sisaTransactions = recentSisa.flatMap((trx) =>
      trx.detailBahanSisa.map((item) => ({
        bahan: item.bahan.name,
        jenis: "Terpakai",
        jumlah: `${item.jumlahDipakai} ${item.bahan.satuan}`,
        tanggal: trx.createdAt,
        status: trx.status,
        statusType: getStatusType(trx.status),
      }))
    );

    const transactions = [...masukTransactions, ...sisaTransactions]
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 10);

    return res.json({
      success: true,
      data: {
        summary: {
          totalMasuk,
          totalDipakai,
          totalStok: totalStok._sum.stok || 0,
          stockMenipis,
        },

        analytics: {
          weekly,
          monthly,
          yearly,
        },

        materialUsage,
        lowStock: lowStockData,
        activities,
        transactions,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan sistem",
    });
  }
});

export default router;