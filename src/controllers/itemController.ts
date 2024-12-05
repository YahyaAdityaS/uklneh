import { Request, Response } from "express"; //impor ekspress
import { PrismaClient } from "@prisma/client"; //
import { request } from "http";
const { v4: uuidv4 } = require("uuid");
import fs from "fs"
import { date, exist, number } from "joi";
import md5 from "md5"; //enskripsi password
import { sign } from "jsonwebtoken"; //buat mendapatkan token jsonwebtoken
import { BASE_URL, SECRET } from "../global";

const prisma = new PrismaClient({ errorFormat: "pretty" })

export const getAllItems = async (request: Request, response: Response) => { //endpoint perlu diganti ganti pakai const kalau tetap let
    //menyiapkan data input dulu(request) --> request
    try {
        //input
        const { search } = request.query //query boleh ada atau tidak params harus ada
        //main
        const allItems = await prisma.items.findMany({
            where: { name: { contains: search?.toString() || "" } } //name buat mencari apa di seacrh, contains == like(mysql) [mengandung kata apa], OR/|| (Salah satu true semaunya all), ""untuk menampilkan kosong
        })
        //output
        return response.json({ //tampilkan juga statusnya(untuk inidkator)
            status: true,
            data: allItems,
            massage: 'Iki Isi Menu E Cah'
        }).status(200) //100 200 Berhasil
    }
    catch (eror) {
        return response
            .json({
                status: `error`,
                massage: `Eror Sam ${eror}`
            })
            .status(400)
    }
}

export const createItems = async (request: Request, response: Response) => {
    try {
        const { name, category, quantity, location } = request.body
        const uuid = uuidv4()

        const newMenu = await prisma.items.create({ //await menunngu lalu dijalankan
            data: { uuid, category, name, quantity: Number(quantity), location}
        })
        return response.json({
            status: `success`,
            massage: `Barang berhasil ditambahkan`,
            data: newMenu,
        }).status(200);
    }
    catch (eror) {
        return response
            .json({
                status: false,
                massage: `Eror iii. $(eror)`
            }).status(400);
    }
}

export const updateItems = async (request: Request, response: Response) => {
    try {
        const { id } = request.params
        const { name, category, quantity, location } = request.body

        const findItems = await prisma.items.findFirst({ where: { id: Number(id) } })
        if (!findItems) return response
            .status(200)
            .json({ status: false, massage: 'Ra Enek Items E Cah' })

        const updateItems = await prisma.items.update({
            data: {
                name: name || findItems.name, //or untuk perubahan (kalau ada yang kiri dijalankan, misal tidak ada dijalankan yang kanan)
                quantity: quantity ? Number(quantity) : findItems.quantity, //operasi tenary (sebelah kiri ? = kondisi (price) jika kondisinya true (:) false )
                category: category || findItems.category,
                location: location || findItems.location,
            },
            where: { id: Number(id) }
        })

        return response.json({
            status: `success`,
            massage: 'Barang berhasil diubah',
            data: updateItems,
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

export const deleteItems = async (request: Request, response: Response) => {
    try {
        const { id } = request.params
        const findItems = await prisma.items.findFirst({ where: { id: Number(id) } })
        if (!findItems) return response
            .status(200)
            .json({ status: false, message: 'Ra Nemu Sam' })

        const deletedItems = await prisma.items.delete({
            where: { id: Number(id) }
        })
        return response.json({
            status: true,
            data: deletedItems,
            message: 'Menu E Iso Dihapus Sam'
        }).status(200)
    } catch (eror) {
        return response
            .json({
                status: false,
                message: `Eror Sam ${eror}`
            }).status(400)
    }
}

export const getItemById = async (request: Request, response: Response) => {
    try {
        // Mendapatkan ID dari parameter URL
        const { id } = request.params;

        // Mencari item berdasarkan ID
        const item = await prisma.items.findUnique({
            where: {
                id: parseInt(id)  // Menyaring berdasarkan ID yang diberikan
            }
        });

        // Jika barang ditemukan, kembalikan data
        if (item) {
            return response.json({
                status: `succes`,
                data: item,
            }).status(200); // Status 200 berarti berhasil
        } else {
            // Jika barang tidak ditemukan, kembalikan error 404
            return response.json({
                status: false,
                message: 'Barang tidak ditemukan'
            }).status(404); // Status 404 berarti tidak ditemukan
        }
    } catch (error) {
        // Tangani kesalahan lainnya
        return response.json({
            status: false,
            message: `Error: ${error}`
        }).status(400); // Status 400 berarti ada kesalahan
    }
};

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
        }
        let payload = JSON.stringify(data); //mennyiapakan data untuk menjadikan token
        let token = sign(payload, SECRET || "token");

        return response
            .status(200)
            .json({
                status: true,
                logged: true,
                message: `Login Succes`, token
            })
    } catch (error) {
        return response
            .json({
                status: false,
                message: `Eror Ga Boong ${error}`
            }).status(400)
    }
}