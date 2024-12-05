import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ errorFormat: "pretty" });

export const PinjamItems = async (request: Request, response: Response) => {
    try {
        const { idUser, idItems, pinjam_date, return_date } = request.body;

        // Validasi jika data idUser atau idItems tidak ada
        if (!idUser || !idItems || !pinjam_date || !return_date) {
            return response.status(400).json({
                status: false,
                message: 'Data yang diperlukan tidak lengkap.',
            });
        }

        // Validasi tanggal pengembalian tidak boleh kurang dari atau sama dengan tanggal peminjaman
        if (new Date(return_date) < new Date(pinjam_date)) {
            return response.status(400).json({
                status: false,
                message: 'Tanggal pengembalian tidak boleh kurang dari atau sama dengan tanggal peminjaman.',
            });
        }

        // Mengecek stok barang terlebih dahulu
        const item = await prisma.items.findUnique({
            where: { id: Number(idItems) },
        });

        if (!item) {
            return response.status(404).json({
                status: false,
                message: 'Barang tidak ditemukan.',
            });
        }

        if (item.quantity <= 0) {
            return response.status(400).json({
                status: false,
                message: 'Stok barang habis, peminjaman tidak dapat dilakukan.',
            });
        }

        // Validasi apakah user ditemukan
        const findUser = await prisma.user.findFirst({
            where: { id: Number(idUser) },
        });

        if (!findUser) {
            return response.status(404).json({
                status: false,
                message: 'User tidak ditemukan.',
            });
        }

        // Membuat peminjaman barang
        const newBorrow = await prisma.pinjam.create({
            data: {
                idUser: Number(idUser),
                idItems: Number(idItems),
                pinjam_date: new Date(pinjam_date),
                return_date: new Date(return_date),
            },
        });

        // Mengurangi stok barang
        await prisma.items.update({
            where: { id: Number(idItems) },
            data: {
                quantity: item.quantity - 1,
            },
        });

        return response.status(200).json({
            status: 'success',
            message: 'Peminjaman berhasil dicatat dan stok barang diperbarui.',
            data: newBorrow,
        });
    } catch (error) {
        // Perbaikan error handling untuk tipe error yang lebih spesifik
        console.error(error);
        return response.status(400).json({
            status: false,
            message: `Error: ${error instanceof Error ? error.message : error}`,
        });
    }
};



