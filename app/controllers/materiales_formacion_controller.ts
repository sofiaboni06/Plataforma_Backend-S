import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import MaterialFormacionService from '#services/material_formacion_service'
import { parseOptionalBoolean } from '#services/query_params'
import MaterialFormacionTransformer, {
  ElementoOpcionTransformer,
  ProgramaOpcionTransformer,
  SolicitudMaterialFormacionTransformer,
} from '#transformers/material_formacion_transformer'
import {
  createMaterialFormacionValidator,
  createSolicitudMaterialFormacionValidator,
  updateMaterialFormacionValidator,
} from '#validators/material_formacion'
import type { EstadoSolicitudMaterialFormacion } from '#models/solicitud_material_formacion'

export default class MaterialesFormacionController {
  private service = new MaterialFormacionService()

  async index({ request, serialize }: HttpContext) {
    const materiales = await this.service.index({
      idPrograma: request.input('idPrograma') ? Number(request.input('idPrograma')) : undefined,
      estado: parseOptionalBoolean(request.input('estado')),
    })

    return serialize(MaterialFormacionTransformer.transform(materiales))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createMaterialFormacionValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const material = await this.service.create(scope, payload)

    return serialize(MaterialFormacionTransformer.transform(material))
  }

  async show({ params, serialize }: HttpContext) {
    const material = await this.service.show(Number(params.id))
    return serialize(MaterialFormacionTransformer.transform(material))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateMaterialFormacionValidator)
    const material = await this.service.update(Number(params.id), payload)

    return serialize(MaterialFormacionTransformer.transform(material))
  }

  async destroy({ params, serialize }: HttpContext) {
    const result = await this.service.remove(Number(params.id))
    return serialize(result)
  }

  /** Opciones del selector de programas: solo los activos. */
  async programas({ serialize }: HttpContext) {
    const programas = await this.service.opcionesProgramas()

    return serialize(ProgramaOpcionTransformer.transform(programas))
  }

  /** Opciones del selector de elementos: identificación global, sin stock. */
  async elementos({ serialize }: HttpContext) {
    const elementos = await this.service.opcionesElementos()

    return serialize(ElementoOpcionTransformer.transform(elementos))
  }

  /** Solicitudes de materiales por programa (?idPrograma= / ?estado=). */
  async solicitudesIndex({ request, serialize }: HttpContext) {
    const estado = request.input('estado')

    const solicitudes = await this.service.solicitudes({
      idPrograma: request.input('idPrograma') ? Number(request.input('idPrograma')) : undefined,
      estado: estado ? (String(estado) as EstadoSolicitudMaterialFormacion) : undefined,
    })

    return serialize(SolicitudMaterialFormacionTransformer.transform(solicitudes))
  }

  /** Registra una solicitud de material para un programa de formación. */
  async solicitudesStore({ auth, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createSolicitudMaterialFormacionValidator)
    const scope = await resolveScope(auth.getUserOrFail())
    const solicitud = await this.service.crearSolicitud(scope, payload)

    return serialize(SolicitudMaterialFormacionTransformer.transform(solicitud))
  }
}
