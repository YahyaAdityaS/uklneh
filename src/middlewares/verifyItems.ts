import { } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { it } from "node:test";
import { userInfo } from "os";

const addDataSchema = Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    location: Joi.string().required(),
    quantity: Joi.number().min(1).required(), 
    user: Joi.optional() 
})

const editDataSchema = Joi.object({
    name: Joi.string().optional(),
    category: Joi.string().optional(),
    location: Joi.string().optional(),
    quantity: Joi.number().min(1).optional(), 
    user: Joi.optional() 
})

export const verifyAddItems = (request: Request, response: Response, next: NextFunction) => {
    const { error } = addDataSchema.validate(request.body, { abortEarly: false })

    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join()
        })
    }
    return next()
}

export const verifyEditItems = (request: Request, response: Response, next: NextFunction) => {
    const { error } = editDataSchema.validate(request.body, { abortEarly: false })

    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join()
        })
    }
    return next()
}