import type { HttpContext } from '@adonisjs/core/http'
import PrestamoService from '#services/prestamo_service'
import PrestamoTransformer from '#transformers/prestamo_transformer'
import { resolveScope } from '#services/access_control'
import {
  createPrestamoValidator,
  updatePrestamoEstadoValidator,
  updatePrestamoValidator,
} from '#validators/prestamo'

export default class PrestamosController {
  async index({ auth, serialize }: HttpContext) {
    const scope = await resolveScope(
      auth.getUserOrFail(),
    )

    const prestamos =
      await new PrestamoService().index(scope)

    return serialize(
      PrestamoTransformer.transform(prestamos),
    )
  }

  async show({
    auth,
    params,
    serialize,
  }: HttpContext) {
    const scope = await resolveScope(
      auth.getUserOrFail(),
    )

    const prestamo =
      await new PrestamoService().show(
        scope,
        Number(params.id),
      )

    return serialize(
      PrestamoTransformer.transform(prestamo),
    )
  }

  async store({
    auth,
    request,
    serialize,
  }: HttpContext) {
    const payload =
      await request.validateUsing(
        createPrestamoValidator,
      )

    const scope = await resolveScope(
      auth.getUserOrFail(),
    )

    const prestamo =
      await new PrestamoService().store(
        scope,
        payload,
      )

    return serialize(
      PrestamoTransformer.transform(prestamo),
    )
  }

  async update({
    auth,
    params,
    request,
    serialize,
  }: HttpContext) {
    const payload =
      await request.validateUsing(
        updatePrestamoValidator,
      )

    const scope = await resolveScope(
      auth.getUserOrFail(),
    )

    const prestamo =
      await new PrestamoService().update(
        scope,
        Number(params.id),
        payload,
      )

    return serialize(
      PrestamoTransformer.transform(prestamo),
    )
  }

  async return({
    auth,
    params,
    serialize,
  }: HttpContext) {
    const scope = await resolveScope(
      auth.getUserOrFail(),
    )

    const prestamo =
      await new PrestamoService().registerReturn(
        scope,
        Number(params.id),
      )

    return serialize(
      PrestamoTransformer.transform(prestamo),
    )
  }

  async changeStatus({
    auth,
    params,
    request,
    serialize,
  }: HttpContext) {
    const { estado } =
      await request.validateUsing(
        updatePrestamoEstadoValidator,
      )

    const scope = await resolveScope(
      auth.getUserOrFail(),
    )

    const prestamo =
      await new PrestamoService().changeStatus(
        scope,
        Number(params.id),
        estado,
      )

    return serialize(
      PrestamoTransformer.transform(prestamo),
    )
  }
}