import Vigencia from '#models/vigencia'
import { DateTime } from 'luxon'

export default class VigenciaTransformer {
  static transform(vigencia: Vigencia) {
    const formatDate = (date: any) => {
      if (!date) return null
      if (date instanceof DateTime) {
        return date.toISODate()
      }
      if (typeof date === 'string') {
        return date.split('T')[0]
      }
      return date
    }

    return {
      anio: vigencia.anio,
      activa: vigencia.activa,
      fechaApertura: formatDate(vigencia.fecha_apertura),
      fechaCierre: formatDate(vigencia.fecha_cierre),
    }
  }

  static transformList(vigencias: Vigencia[]) {
    return vigencias.map((v) => this.transform(v))
  }
}