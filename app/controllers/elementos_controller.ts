import { Exception } from '@adonisjs/core/exceptions'
import ElementoService from '#services/elemento_service'
import { solicitudes } from '#services/notificacion_service'
import FotoElementoService from '#services/foto_elemento_service'
import ElementoTransformer from '#transformers/elemento_transformer'
import { onlyRequests, resolveScope } from '#services/access_control'
import {
  createElementoValidator,
  fotoElementoValidator,
  updateElementoValidator,
} from '#validators/elemento'
import type { HttpContext } from '@adonisjs/core/http'

export default class ElementosController {
  async index({ auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const elementos = await new ElementoService().list(scope)
    return serialize(ElementoTransformer.transform(elementos, !onlyRequests(scope)))
  }

  async store({ request, auth, serialize }: HttpContext) {
    const payload = await request.validateUsing(createElementoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const creado = await new ElementoService().create(scope, payload)
    return serialize(ElementoTransformer.transform(creado))
  }

  async show({ params, auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const elemento = await new ElementoService().findById(scope, Number(params.id))
    return serialize(ElementoTransformer.transform(elemento, !onlyRequests(scope)))
  }

  /**
   * `solicitudesPendientes` trae las solicitudes que la nueva existencia puede
   * servir. Vacío si la cantidad no subió o no hay nadie esperando.
   */
  async update({ params, request, auth, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateElementoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const { elemento, solicitudesPendientes } = await new ElementoService().update(
      scope,
      Number(params.id),
      payload
    )
    const data = await serialize.withoutWrapping(ElementoTransformer.transform(elemento))

    return response.ok({
      ...(solicitudesPendientes.length
        ? {
            message: `Agregaste nuevas unidades de ${elemento.nombre} que tienen solicitudes pendientes. Tienes ${solicitudes(solicitudesPendientes.length)} por actualizar y entregar.`,
          }
        : {}),
      data: { ...data, solicitudesPendientes },
    })
  }

  async showFoto({ params, auth, response }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const id = Number(params.id)
    const elemento = await new ElementoService().findById(scope, id)
    const archivo = await new FotoElementoService().rutaEnDisco(id, elemento.urlFotografia)

    if (!archivo) {
      throw new Exception('El elemento no tiene fotografía', {
        status: 404,
        code: 'E_FOTO_AUSENTE',
      })
    }

    response.header('Cache-Control', 'private, max-age=86400')
    response.attachment(archivo, 'foto.webp', 'inline', true)
  }

  async storeFoto({ params, request, auth, serialize }: HttpContext) {
    const { fotografia } = await request.validateUsing(fotoElementoValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const id = Number(params.id)
    const elementos = new ElementoService()

    await elementos.findById(scope, id)
    const ruta = await new FotoElementoService().guardar(id, fotografia)
    const actualizado = await elementos.asignarFotografia(scope, id, ruta)

    return serialize(ElementoTransformer.transform(actualizado))
  }

  async destroyFoto({ params, auth, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const id = Number(params.id)
    const elementos = new ElementoService()
    const fotos = new FotoElementoService()
    const elemento = await elementos.findById(scope, id)
    const actualizado = await elementos.asignarFotografia(scope, id, null)

    if (elemento.urlFotografia === fotos.rutaDe(id)) {
      await fotos.eliminar(id)
    }

    return serialize(ElementoTransformer.transform(actualizado))
  }
}
