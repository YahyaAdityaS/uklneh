import { Request, response, Response } from "express";
import { $Enums, PrismaClient, role} from "@prisma/client";
import { request } from "http";
const { v4: uuidv4 } = require("uuid");
import { BASE_URL, SECRET } from "../global";
import fs from "fs"
import { date, exist, number } from "joi";
import md5 from "md5"; //enskripsi password
import { sign } from "jsonwebtoken"; //buat mendapatkan token jsonwebtoken

const prisma = new PrismaClient({ errorFormat: "pretty" })
export const getAllUser = async (request: Request, response: Response) => {
    try {
        const { search } = request.query
        const allUser = await prisma.user.findMany({
            where: { username: { contains: search?.toString() || "" } }
        })
        return response.json({
            status: true,
            data: allUser,
            message: 'Iki Isi User E Cah'
        }).status(200)
    }
    catch (error) {
        return response
            .json({
                status: false,
                message: `Eror Sam ${error}`
            }).status(400)
    }
}

export const createUser = async (request: Request, response: Response) => {
    try {
        const { username, password, role} = request.body
        const uuid = uuidv4()
        const existingUser = await prisma.user.findFirst({
            where: { username },
        });

        if (existingUser) {
            return response.status(400).json({
                status: false,
                message: "Username sudah digunakan, silakan gunakan username lain",
            });
        }
        const newUser = await prisma.user.create({
            data: { uuid, username, password: md5(password), role}
        })
        return response.json({
            status: true,
            date: newUser,
            message: `Gawe User Iso Cah`
        })
    } catch (error) {
        return response
            .json({
                status: false,
                message: `Eror Gawe User E Cah ${error}`
            }).status(400);
    }
}


export const updateUser = async (request: Request, response: Response) => {
    try {
        const { id } = request.params
        const { username, password, role } = request.body

        const findUser = await prisma.user.findFirst({ where: { id: Number(id) } })
        if (!findUser) return response
            .status(200)
            .json({
                status: false,
                massage: 'Ra Enek User E Cah'
            })
        
            const existingUser = await prisma.user.findFirst({
                where: { username },
            });
    
            if (existingUser) {
                return response.status(400).json({
                    status: false,
                    message: "Username sudah digunakan, silakan gunakan username lain",
                });
            }
        
            
        const updateUser = await prisma.user.update({
            data: {
                username: username || findUser.username, //or untuk perubahan (kalau ada yang kiri dijalankan, misal tidak ada dijalankan yang kanan), //operasi tenary (sebelah kiri ? = kondisi (price) jika kondisinya true (:) false )
                password: password || findUser.password,
                role: role || findUser.role
            },
            where: { id: Number(id) }
        })

        return response.json({
            status: true,
            data: updateUser,
            massage: 'Update User Iso Cah'
        })

    } catch (error) {
        return response
            .json({
                status: false,
                massage: `Eror Sam ${error}`
            })
            .status(400)
    }
}

export const deleteUser = async (request: Request, response: Response) => {
    try {
        const { id } = request.params
        const findUser = await prisma.user.findFirst({ where: { id: Number(id) } })
        if (!findUser) return response
            .status(200)
            .json({ status: false, message: 'Ra Nemu Menu E Sam' })

        const deleteUser = await prisma.user.delete({
            where: { id: Number(id) }
        })
        return response.json({
            status: true,
            data: deleteUser,
            message: 'User E Iso Dihapus Sam'
        }).status(200)
    } catch (eror) {
        return response
            .json({
                status: false,
                message: `Eror Sam ${eror}`
            }).status(400)
    }
}

export const authentication = async (request: Request, response: Response) => {
    try {
        const { username, password } = request.body;
        const findUser = await prisma.user.findFirst({
            where: { username, password: md5(password) },
        });
        if (!findUser) {
            return response
                .status(200)
                .json({
                    status: false,
                    logged: false,
                    massage: `Email Ro Password Salah`
                })
        }
        let data = {
            id: findUser.id,
            username: findUser.username,
            password: findUser.password,
            role: findUser.role
        }
        let payload = JSON.stringify(data); //mennyiapakan data untuk menjadikan token
        let token = sign(payload, SECRET || "token");

        return response
            .status(200)
            .json({
                status: `succes`,
                message: `Login Berhasil`, token
            })
    } catch (error) {
        return response
            .json({
                status: false,
                message: `Eror Ga Boong ${error}`
            }).status(400)
    }
}


