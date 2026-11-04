import type { HttpContext } from '@adonisjs/core/http'
import type { DateTime } from 'luxon'
import { resolveScope } from '#services/access_control'
import VigenciaService from '#services/vigencia_service'
import VigenciaEspecialTransformer from '#transformers/vigencia_especial_transformer'
import VigenciaTransformer from '#transformers/vigencia_transformer'
import {
  createVigenciaEspecialValidator,
  createVigenciaValidator,
  programaVigenciaEspecialValidator,
  updateVigenciaEspecialValidator,
  updateVigenciaValidator,
} from '#validators/vigencia'

function fechasDe(payload: {
  fechaApertura?: DateTime | null
  fechaCierre?: DateTime | null
  fecha_apertura?: DateTime | null
  fecha_cierre?: DateTime | null
}) {
  return {
    fechaApertura: payload.fechaApertura ?? payload.fecha_apertura ?? null,
    fechaCierre: payload.fechaCierre ?? payload.fecha_cierre ?? null,
  }
}

export default class VigenciasController {
  private service = new VigenciaService()

  async index({ auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    return serialize(VigenciaTransformer.transform(await this.service.index(scope)))
  }

  async activa({ auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const vigencia = await this.service.activa(scope)
    return serialize(vigencia ? VigenciaTransformer.transform(vigencia) : null)
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createVigenciaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const vigencia = await this.service.store(scope, {
      anio: payload.anio,
      activa: payload.activa,
      ...fechasDe(payload),
    })
    return serialize(VigenciaTransformer.transform(vigencia))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateVigenciaValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const vigencia = await this.service.update(scope, Number(params.anio ?? params.id), {
      activa: payload.activa,
      ...fechasDe(payload),
    })
    return serialize(VigenciaTransformer.transform(vigencia))
  }

  async destroy({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    return serialize(await this.service.remove(scope, Number(params.anio ?? params.id)))
  }

  async especiales({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const filas = await this.service.especiales(scope, Number(params.anio))
    return serialize(VigenciaEspecialTransformer.transform(filas))
  }

  async crearEspecial({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createVigenciaEspecialValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const especial = await this.service.crearEspecial(scope, Number(params.anio), payload)
    return serialize(VigenciaEspecialTransformer.transform(especial))
  }

  async actualizarEspecial({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateVigenciaEspecialValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const especial = await this.service.actualizarEspecial(
      scope,
      Number(params.anio),
      Number(params.id),
      payload
    )
    return serialize(VigenciaEspecialTransformer.transform(especial))
  }

  async agregarPrograma({ auth, params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(programaVigenciaEspecialValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const especial = await this.service.agregarPrograma(
      scope,
      Number(params.anio),
      Number(params.id),
      payload.programaId
    )
    return serialize(VigenciaEspecialTransformer.transform(especial))
  }

  async quitarPrograma({ auth, params, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    return serialize(
      await this.service.quitarPrograma(
        scope,
        Number(params.anio),
        Number(params.id),
        Number(params.programaId)
      )
    )
  }
}
