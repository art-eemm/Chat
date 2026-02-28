import crypto from "crypto";

const algorithm = "aes-256-cbc";
const secretKey = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

//* Cifrado de texto plano
export function encryptText(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return {
    contenido_cifrado: encrypted.toString("hex"),
    iv: iv.toString("hex"),
  };
}

//*  Descifrado de texto
export function decryptText(contenido_cifrado: string, ivHex: string) {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  const decrypted = Buffer.concat([ decipher.update(Buffer.from(contenido_cifrado, "hex")), decipher.final(), ]);
  return decrypted.toString("utf8");
}