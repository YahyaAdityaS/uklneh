import { Request, Response, NextFunction } from 'express';

const validasiTanggal = (req: Request, res: Response, next: NextFunction) => {
    const { start_date, end_date } = req.body;

    // Cek apakah tanggal ada
    if (!start_date || !end_date) {
        return res.status(400).json({
            status: 'failure',
            message: 'Start date dan End date harus disediakan.',
        });
    }

    // Parse tanggal dari string
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Cek apakah start_date dan end_date memiliki format yang valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
            status: 'failure',
            message: 'Format tanggal tidak valid.',
        });
    }

    // Cek apakah start_date lebih besar dari end_date
    if (startDate > endDate) {
        return res.status(400).json({
            status: 'failure',
            message: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.',
        });
    }

    // Jika validasi berhasil, lanjutkan ke handler berikutnya
    next();
};

export default validasiTanggal;
