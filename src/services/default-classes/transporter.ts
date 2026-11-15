import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

import path from 'path';
import { existsSync } from 'fs';

const caminhoEnv = [
  path.resolve(process.cwd(), 'src', '.env'),
  path.resolve(process.cwd(), '.env'),
].find(existsSync);

if (caminhoEnv) {
  dotenv.config({ path: caminhoEnv });
}

export default class CreateTransporter {
  public static transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 3,
    maxMessages: 2,
    ...(process.env.EMAIL_USER && process.env.EMAIL_PASS
      ? {
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
      : {}),
    family: 4,
    connectionTimeout: 5000,
  });
}
