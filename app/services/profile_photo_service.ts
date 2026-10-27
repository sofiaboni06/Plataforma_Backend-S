import { Exception } from '@adonisjs/core/exceptions'
import app from '@adonisjs/core/services/app'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { randomUUID } from 'node:crypto'
import { access, mkdir, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type User from '#models/usuario'

export default class ProfilePhotoService {
  static readonly extnames = ['jpg', 'jpeg', 'png', 'webp']
  static readonly maxSize = '8mb'

  private dir() {
    return app.makePath('storage', 'perfiles')
  }

  /** Ruta absoluta de la foto del usuario, o null si no tiene. */
  pathOf(user: User) {
    if (!user.fotografia) return null
    // basename evita rutas con ../ aunque la columna se corrompa
    return join(this.dir(), basename(user.fotografia))
  }

  async exists(path: string) {
    try {
      await access(path)
      return true
    } catch {
      return false
    }
  }

  async save(user: User, file: MultipartFile) {
    if (!file.isValid) {
      throw new Exception(this.message(file), { status: 422, code: 'E_VALIDATION_ERROR' })
    }

    await mkdir(this.dir(), { recursive: true })

    const name = `${user.id}-${randomUUID()}.${file.extname ?? 'jpg'}`
    await file.move(this.dir(), { name })

    const previous = this.pathOf(user)
    user.fotografia = name
    await user.save()

    if (previous) await this.removeFile(previous)
  }

  async remove(user: User) {
    const previous = this.pathOf(user)
    user.fotografia = null
    await user.save()

    if (previous) await this.removeFile(previous)
  }

  private async removeFile(path: string) {
    try {
      await unlink(path)
    } catch {
      /* si el archivo ya no existe, no pasa nada */
    }
  }

  private message(file: MultipartFile) {
    const error = file.errors[0]
    if (error?.type === 'size') return 'La imagen no puede pesar más de 8 MB'
    if (error?.type === 'extname') return 'Usa una imagen JPG, PNG o WebP'
    return 'No se pudo procesar la imagen'
  }
}