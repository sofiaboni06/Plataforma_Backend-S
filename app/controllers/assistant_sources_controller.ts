import type { HttpContext } from '@adonisjs/core/http'
import { resolveScope } from '#services/access_control'
import AssistantSourceService from '#services/assistant_source_service'
import { parseOptionalBoolean } from '#services/query_params'
import AssistantSourceTransformer from '#transformers/assistant_source_transformer'
import {
  createAssistantSourceValidator,
  searchAssistantSourceValidator,
  updateAssistantSourceValidator,
} from '#validators/assistant_source'

export default class AssistantSourcesController {
  async index({ auth, request, serialize }: HttpContext) {
    const scope = await resolveScope(auth.getUserOrFail())
    const incluirApagadas = parseOptionalBoolean(request.input('incluirApagadas')) === true
    const guias = await new AssistantSourceService().index(scope, incluirApagadas)

    return serialize(AssistantSourceTransformer.transform(guias))
  }

  async buscar({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(searchAssistantSourceValidator)
    const guias = await new AssistantSourceService().buscar(payload.pregunta)

    return serialize(AssistantSourceTransformer.transform(guias))
  }

  async preguntar({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(searchAssistantSourceValidator)
    const resultado = await new AssistantSourceService().preguntar(payload.pregunta, user.nombres)

    return serialize(resultado)
  }

  async store({ request, serialize }: HttpContext) {
    const payload = await request.validateUsing(createAssistantSourceValidator)
    const guia = await new AssistantSourceService().store(payload)

    return serialize(AssistantSourceTransformer.transform(guia))
  }

  async update({ params, request, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateAssistantSourceValidator)
    const guia = await new AssistantSourceService().update(Number(params.id), payload)

    return serialize(AssistantSourceTransformer.transform(guia))
  }
}
