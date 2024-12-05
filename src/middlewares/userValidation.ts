import { role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { request } from "http";
import Joi from "joi";

const authSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(3).alphanum().required(),
});

const addDataSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(3).required(),
    role: Joi.allow().valid('ADMIN', 'STAF').optional() //optional (Bisa diisi bisa tidak)
}).unknown(true)

const editDataSchema = Joi.object({
    username: Joi.string().optional(),
    password: Joi.string().min(3).optional(),
    role: Joi.allow().valid('ADMIN', 'STAF').optional() 
}).unknown(true)

export const verifyAuthentication = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const {error} = authSchema.validate(request.body, {abortEarly: false});
    if(error) {
        return response.status(400).json({
            status: false,
            message: error.details.map((it) => it.message).join(),
        })
    }
    return next();  
}

export const verifyAddUser = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    //beh
    const {error} = addDataSchema.validate(request.body, {abortEarly: false});
    if(error) {
        return response.status(400).json({
            status: false,
            message: error.details.map((it) => it.message).join(),
        })
    }
    return next();
}
export const verifyEditUser = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    //beh
    const {error} = editDataSchema.validate(request.body, {abortEarly: false});
    if(error) {
        return response.status(400).json({
            status: false,
            message: error.details.map((it) => it.message).join(),
        })
    }
    return next();
}