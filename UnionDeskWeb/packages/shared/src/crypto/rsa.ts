import { JSEncrypt } from "jsencrypt";

function normalizePem(pem: string): string {
  return pem.trim();
}

export function encryptPasswordWithRsa(publicKeyPem: string, plaintext: string): string {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(normalizePem(publicKeyPem));
  const encrypted = encryptor.encrypt(plaintext);
  if (!encrypted) {
    throw new Error("RSA encryption failed");
  }
  return encrypted;
}

