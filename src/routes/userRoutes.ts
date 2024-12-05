import express from "express"
import {getAllUser, createUser, updateUser, deleteUser, authentication  } from "../controllers/userControllers"
import { verifyAddUser, verifyEditUser, verifyAuthentication } from "../middlewares/userValidation"
import { verifyToken, verifyRole } from "../middlewares/authorization"

const app = express()
app.use(express.json())

app.get(`/`,[verifyToken, verifyRole(["ADMIN"])], getAllUser)
app.post(`/create`, [verifyToken, verifyRole(["ADMIN"])], [verifyAddUser], createUser)
app.put(`/:id`, [verifyToken, verifyRole(["ADMIN"])], [verifyEditUser], updateUser)
app.post(`/login`,[verifyAuthentication], authentication)
app.delete(`/:id`, [verifyToken, verifyRole(["ADMIN"])], deleteUser)
export default app 