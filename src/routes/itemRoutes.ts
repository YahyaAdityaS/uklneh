import express from "express"
import { getAllItems, createItems, deleteItems, updateItems, getItemById } from "../controllers/itemController"
import { verifyAddItems, verifyEditItems } from "../middlewares/verifyItems"
import { verifyRole, verifyToken } from "../middlewares/authorization"
//
import { PinjamItems } from "../controllers/pinjamController"
import { KembalikanBarang } from "../controllers/kembaliController"
import { laporanPenggunaanBarang, usage, analisisBarang } from "../controllers/laporanController"
import { verifyAddPinjam} from "../middlewares/verifyPinjam"
import { verifyAddKembalikan} from "../middlewares/verifyKembali"
import validasiTanggal from "../middlewares/verifyUsage"

const app = express()
app.use(express.json())

app.get(`/`, [verifyToken, verifyRole(["STAF", "ADMIN"])], getAllItems)
app.get(`/:id`, [verifyToken, verifyRole(["STAF", "ADMIN"])], getItemById)
app.post(`/`, [verifyToken, verifyRole(["ADMIN"]), verifyAddItems], createItems)
app.put(`/:id`, [verifyToken, verifyRole(["ADMIN"]), verifyEditItems], updateItems)
app.delete(`/:id`, [verifyToken, verifyRole(["ADMIN"])], deleteItems)
//
app.post(`/borrow`, verifyAddPinjam, PinjamItems)
app.post(`/return`, verifyAddKembalikan, KembalikanBarang)
app.post(`/usage-report`,validasiTanggal, usage)
app.post(`/borrow-analysis`, validasiTanggal,analisisBarang)

export default app 