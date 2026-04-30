const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex"); 
// must be 32 bytes (64 hex chars)

exports.encrypt = function (text) {
  const iv = crypto.randomBytes(12); // recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // store iv + authTag + encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

exports.decrypt = function (encryptedText) {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}