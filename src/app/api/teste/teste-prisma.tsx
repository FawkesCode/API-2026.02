'use server'

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/lib/generated/prisma/client";



export default async function TesteUser() {
    const adapter = new PrismaMariaDb({
        host: "localhost",
        port: 3306,
        connectionLimit: 5,
    });

    const prisma = new PrismaClient({ adapter });

    const user = await prisma.teste.create({
        data: {
            id: 1,
            nome: "james"
        }
    })
    console.log(user)

    const querieUser = await prisma.teste.findFirst()
    console.log(querieUser)
    return (
        <>
            <h1>Usuário:  </h1>
            <span>{user.nome}</span>

            <h1>Usuário querie: </h1>
            <span>{querieUser?.nome}</span>

        </>
    )
}