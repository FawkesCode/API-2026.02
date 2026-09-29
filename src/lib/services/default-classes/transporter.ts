import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'src', '.env') });
export default class CreateTransporter{
    
    public static transporter =  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    pool: true,    
    maxConnections: 3, 
    maxMessages: 2,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    family: 4,
    connectionTimeout: 5000,
    } as any);


}