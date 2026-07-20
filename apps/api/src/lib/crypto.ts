import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { config } from '../config.js'

/**
 * AES-256-GCM for values that must be encrypted at rest — Google refresh tokens
 * today, sensitive profile columns as the model grows. Format is
 * `iv:authTag:ciphertext`, all hex, so it round-trips through a text column.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const key = Buffer.from(config.ENCRYPTION_KEY, 'hex')

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':')
}

export function decrypt(payload: string): string {
  const [ivHex, authTagHex, ciphertextHex] = payload.split(':')
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Malformed ciphertext payload')
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}
