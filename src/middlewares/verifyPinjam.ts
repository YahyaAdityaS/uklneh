import { NextFunction, Request, Response } from "express";
import Joi from "joi";

// Skema validasi menggunakan Joi
const addDataSchema = Joi.object({
    idUser: Joi.number().required(),
    idItems: Joi.number().required(),
    pinjam_date: Joi.date().optional(),
    return_date: Joi.date().required(),
});

export const verifyAddPinjam = (request: Request, response: Response, next: NextFunction) => {
    // Validasi body menggunakan Joi
    const { error } = addDataSchema.validate(request.body, { abortEarly: false });

    if (error) {
        // Mengembalikan error jika validasi gagal
        return response.status(400).json({
            status: false,
            message: error.details.map(it => it.message).join(', '),
        });
    }
    
    // Jika tidak ada error, lanjutkan ke middleware selanjutnya
    return next();
};


