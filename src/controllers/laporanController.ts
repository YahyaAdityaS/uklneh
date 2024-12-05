import { Request, Response } from 'express';
import { Items, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()); // Return false jika invalid
};

export const laporanPenggunaanBarang = async (request: Request, response: Response) => {
    try {
        const { start_date, end_date, groupBy, category } = request.body;

        // Validasi parameter tanggal
        if (!start_date || !end_date) {
            return response.status(400).json({
                status: false,
                message: 'Tanggal mulai dan tanggal selesai harus diisi.',
            });
        }

        // Ambil data peminjaman yang terjadi antara start_date dan end_date
        const penggunaan = await prisma.pinjam.findMany({
            where: {
                pinjam_date: {
                    gte: new Date(start_date), // Filter mulai dari start_date
                    lte: new Date(end_date), // Filter sampai end_date
                },
            },
            include: {
                Items: true, // Mengambil data barang yang dipinjam
                User: true,  // Mengambil data pengguna yang meminjam
            },
        });

        let laporan = penggunaan;

        // Jika ada kategori, filter berdasarkan kategori
        if (category) {
            laporan = laporan.filter((peminjaman: any) => {
                return peminjaman.Items?.category.toLowerCase() === category.toLowerCase();
            });

            // Jika tidak ada data yang sesuai dengan kategori
            if (laporan.length === 0) {
                return response.status(404).json({
                    status: true,
                    message: `Tidak ada data yang sesuai dengan kategori '${category}' yang diminta.`,
                    data: [],
                });
            }
        }

        // Jika ada groupBy (lokasi), filter berdasarkan lokasi
        if (groupBy) {
            laporan = laporan.filter((peminjaman: any) => {
                return peminjaman.Items?.location.toLowerCase() === groupBy.toLowerCase();
            });

            // Jika tidak ada data yang sesuai dengan lokasi
            if (laporan.length === 0) {
                return response.status(404).json({
                    status: true,
                    message: `Tidak ada data yang sesuai dengan lokasi '${groupBy}' yang diminta.`,
                    data: [],
                });
            }
        }

        // Jika setelah filter masih ada data, kirimkan data yang sesuai
        return response.status(200).json({
            status: true,
            message: 'Laporan penggunaan barang berhasil',
            data: laporan,
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({
            status: false,
            message: `Error: ${error instanceof Error ? error.message : error}`,
        });
    }
};


export const usage = async (request: Request, response: Response) => {
    // Mendefinisikan struktur data untuk laporan
    interface UsageAnalysis {
        group: string; // Kategori atau lokasi
        total_borrowed: number; // Total barang dipinjam
        total_returned: number; // Total barang dikembalikan
        items_in_use: number; // Barang yang masih digunakan
    }

    try {
        // Ambil data dari body request
        const { start_date, end_date, group_by } = request.body;

        // Validasi input tanggal
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (!start_date || !end_date || startDate > endDate) {
            return response.status(400).json({
                status: "failure",
                message: "Tanggal mulai tidak boleh lebih besar dari tanggal akhir.",
            });
        }

        // Validasi nilai 'group_by', hanya boleh 'category' atau 'location'
        const allowedGroupBy = ['category', 'location'];
        if (!allowedGroupBy.includes(group_by)) {
            return response.status(400).json({
                status: "failure",
                message: "Parameter 'group_by' hanya boleh berisi 'category' atau 'location'.",
            });
        }

        // Ambil data barang dan peminjaman berdasarkan rentang tanggal
        const result = await prisma.items.findMany({
            include: {
                Pinjam: {
                    where: {
                        pinjam_date: {
                            gte: startDate, // Tanggal peminjaman lebih besar atau sama dengan start_date
                            lte: endDate,   // Tanggal peminjaman lebih kecil atau sama dengan end_date
                        },
                    },
                    select: {
                        pinjam_date: true, // Tanggal peminjaman
                        return_date: true, // Tanggal pengembalian
                        idItems: true, // ID barang yang dipinjam
                        idUser: true, // ID pengguna yang meminjam
                        Return: {
                            where: {
                                return_date: {
                                    gte: startDate, // Pengembalian dalam periode waktu yang sama
                                    lte: endDate,
                                },
                            },
                            select: {
                                return_date: true, // Tanggal pengembalian
                                condition: true,  // Kondisi barang saat dikembalikan
                            },
                        },
                    },
                },
            },
        });

        // Jika tidak ada data ditemukan
        if (result.length === 0) {
            return response.status(200).json({
                status: "success",
                message: "Tidak ada data yang ditemukan untuk periode ini.",
                data: [],
            });
        }

        // Proses data untuk laporan penggunaan
        const usageAnalysisMap: { [key: string]: UsageAnalysis } = {};

        result.forEach((barang) => {
            const { category, location, Pinjam } = barang;

            Pinjam.forEach((pinjam) => {
                // Tentukan grup berdasarkan 'category' atau 'location'
                const key = group_by === 'category' ? category : location;

                // Jika grup belum ada, inisialisasi objek analisis untuk grup ini
                if (!usageAnalysisMap[key]) {
                    usageAnalysisMap[key] = {
                        group: key,
                        total_borrowed: 0,
                        total_returned: 0,
                        items_in_use: 0,
                    };
                }

                // Hitung jumlah peminjaman
                const totalBorrowed = 1; // Setiap pinjaman dihitung satu
                const totalReturned = pinjam.Return.length > 0 ? 1 : 0; // Jika ada pengembalian, total dikembalikan 1
                const itemsInUse = totalBorrowed - totalReturned; // Barang yang masih digunakan

                // Tambahkan data ke dalam analisis untuk grup yang sesuai
                usageAnalysisMap[key].total_borrowed += totalBorrowed;
                usageAnalysisMap[key].total_returned += totalReturned;
                usageAnalysisMap[key].items_in_use += itemsInUse;
            });
        });

        // Mengonversi map menjadi array untuk hasil analisis
        const usageAnalysis: UsageAnalysis[] = Object.values(usageAnalysisMap);

        // Response sukses dengan data analisis
        return response.status(200).json({
            status: "success",
            data: {
                analysis_period: {
                    start_date,
                    end_date,
                },
                usage_analysis: usageAnalysis,
            },
        });
    } catch (error) {
        // Tangani error jika terjadi
        console.error("Error:", error);
        return response.status(500).json({
            status: "failure",
            message: `Terjadi kesalahan: ${error instanceof Error ? error.message : error}`,
        });
    }
};

export const analisisBarang = async (request: Request, response: Response) => {
    try {
        const { start_date, end_date } = request.body;

        // Validasi format tanggal
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        // Pastikan tanggal yang diberikan valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return response.status(400).json({
                status: "failed",
                message: "Tanggal yang dimasukkan tidak valid.",
            });
        }

        // Validasi: pastikan start_date tidak lebih besar dari end_date
        if (startDate > endDate) {
            return response.status(400).json({
                status: "failed",
                message: "Tanggal mulai tidak boleh lebih besar dari tanggal akhir.",
            });
        }

        // Mendapatkan barang yang paling sering dipinjam dalam rentang tanggal
        const frequentlyBorrowedItems = await prisma.pinjam.groupBy({
            by: ['idItems'],
            where: {
                pinjam_date: {
                    gte: startDate,
                },
                return_date: {
                    lte: endDate,
                },
            },
            _count: {
                idItems: true,
            },
            orderBy: {
                _count: {
                    idItems: 'desc',
                }
            },
        });

        // Mendapatkan detail barang yang sering dipinjam
        const frequentlyBorrowedItemDetails = await Promise.all(frequentlyBorrowedItems.map(async (item) => {
            if (item.idItems === null) return null;

            const barang = await prisma.items.findUnique({
                where: { id: item.idItems },
                select: { id: true, name: true, category: true },
            });

            return barang ? {
                idBarang: item.idItems,
                name: barang.name,
                category: barang.category,
                total_borrowed: item._count.idItems,
            } : null;
        })).then(results => results.filter(item => item !== null));

        // Mendapatkan barang yang telat pengembalian dalam rentang tanggal
        const inefficientItems = await prisma.pinjam.groupBy({
            by: ['idItems'],
            where: {
                pinjam_date: {
                    gte: startDate,
                },
                return_date: {
                    gt: endDate, // Pengembalian lebih dari tanggal akhir
                }
            },
            _count: {
                idItems: true,
            },
            _sum: {
                idItems: true,
            },
            orderBy: {
                _count: {
                    idItems: 'desc',
                }
            },
        });

        // Mendapatkan detail barang yang telat pengembalian
        const inefficientItemDetails = await Promise.all(inefficientItems.map(async (item) => {
            if (item.idItems === null) return null;

            const barang = await prisma.items.findUnique({
                where: { id: item.idItems },
                select: { id: true, name: true, category: true },
            });

            return barang ? {
                idBarang: item.idItems,
                name: barang.name,
                category: barang.category,
                total_borrowed: item._count.idItems,
                total_late_returns: item._sum?.idItems ?? 0,
            } : null;
        })).then(results => results.filter(item => item !== null));

        // Mengembalikan respons sukses dengan data analisis
        return response.status(200).json({
            status: "success",
            data: {
                analysis_period: {
                    start_date: start_date,
                    end_date: end_date
                },
                frequently_borrowed_items: frequentlyBorrowedItemDetails,
                inefficient_items: inefficientItemDetails
            },
            message: "Analisis barang berhasil dihasilkan.",
        });

    } catch (error) {
        // Menangani kesalahan yang tidak terduga
        return response.status(500).json({
            status: "failed",
            message: `Terdapat sebuah kesalahan: ${error}`,
        });
    }
};
