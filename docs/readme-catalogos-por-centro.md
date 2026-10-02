# Catálogos estándar

Esta guía reemplaza la versión en la que cada centro tenía su propia clasificación, unidad, uso presupuestal y código UNSPSC.

El contrato para armar las pantallas está en [readme-frontend.md](./readme-frontend.md).

Clasificación, unidad de medida, uso presupuestal, código UNSPSC, categoría y subcategoría son **una sola lista para todos los centros**. Las crea el administrador de la plataforma (`isAdmin: true`). El encargado solo las lee para los selects del elemento.

No se envía `?idCformacion=` y el body no lleva centro. Esas respuestas ya no traen `idCformacion`.

El ítem y el elemento siguen siendo del centro. El ítem del elemento tiene que ser del mismo centro que el stand (`E_ITEM_OTRO_CENTRO`). Clasificación, unidad, uso y UNSPSC no se validan contra el centro del stand.
