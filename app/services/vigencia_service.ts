import Vigencia from '#models/vigencia'
import type { Infer } from '@vinejs/vine/types'
import { createVigenciaValidator } from '#validators/vigencia'

type CreateVigenciaPayload = Infer<typeof createVigenciaValidator>

export default class VigenciaService {
  async list() {
    return await Vigencia.all()
  }

  async create(payload: CreateVigenciaPayload) {
    return await Vigencia.create(payload as any)
  }

  async findById(id: number) {
    const vigencia = await Vigencia.find(id)
    
    if (!vigencia) {
      throw new Error('La vigencia no existe')
    }
    
    return vigencia
  }

  async update(id: number, payload: Partial<CreateVigenciaPayload>) {
    const vigencia = await this.findById(id)
    
    vigencia.merge(payload as any)
    
    await vigencia.save()
    return vigencia
  }

  async delete(id: number) {
    const vigencia = await this.findById(id)
    await vigencia.delete()
    return true
  }
}