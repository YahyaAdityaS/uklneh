import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ errorFormat: "pretty" });

export const KembalikanBarang = async (request: Request, response: Response) => {
    try {
        const { idPinjam, return_date } = request.body;

        // Validasi input
        if (!idPinjam || !return_date) {
            return response.status(400).json({
                status: "failure",
                message: "Data yang diperlukan tidak lengkap.",
            });
        }

        // Cek apakah peminjaman sudah pernah dikembalikan
        const existingReturn = await prisma.return.findFirst({
            where: { idPinjam },
        });

        if (existingReturn) {
            return response.status(400).json({
                status: "failure",
                message: "Barang dengan idPinjam ini sudah pernah dikembalikan.",
            });
        }

        // Mencari data peminjaman berdasarkan idPinjam
        const pinjam = await prisma.pinjam.findUnique({
            where: { id: idPinjam },
            include: { Items: true, User: true }, // Mengambil data barang dan pengguna
        });

        if (!pinjam) {
            return response.status(404).json({
                status: "failure",
                message: "Peminjaman tidak ditemukan.",
            });
        }

        if (!pinjam.Items) {
            return response.status(404).json({
                status: "failure",
                message: "Data barang tidak ditemukan untuk peminjaman ini.",
            });
        }

        // Validasi apakah tanggal pengembalian sesuai
        if (new Date(return_date).toISOString().split("T")[0] !== pinjam.return_date.toISOString().split("T")[0]) {
            return response.status(400).json({
                status: "failure",
                message: "Tanggal pengembalian tidak sesuai dengan data peminjaman.",
            });
        }

        // Tambahkan data pengembalian ke tabel `Return`
        const newReturn = await prisma.return.create({
            data: {
                idPinjam,
                return_date: new Date(return_date),
            },
        });

        // Perbarui stok barang (quantity) setelah barang dikembalikan
        await prisma.items.update({
            where: { id: pinjam.Items.id },
            data: {
                quantity: pinjam.Items.quantity + 1, // Menambah stok barang
            },
        });

        // Respons sesuai format yang diminta
        return response.status(200).json({
            status: "success",
            message: "Pengembalian berhasil dicatat",
            data: {
                borrow_id: pinjam.id,
                item_id: pinjam.Items.id,
                user_id: pinjam.User?.id || null,
                actual_return_date: return_date, // Tanggal pengembalian aktual
            },
        });
    } catch (error) {
        console.error("Error:", error);
        return response.status(500).json({
            status: "failure",
            message: `Terjadi kesalahan: ${error instanceof Error ? error.message : error}`,
        });
    }
};





