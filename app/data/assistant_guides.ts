/**
 * Guías que el asistente lee. Cada texto describe lo que la plataforma
 * hace hoy. El seeder les agrega el aviso de permisos.
 */

export const TEXTO_EQUIPO = `SIGMA la creó el equipo de la Fábrica de Software del SENA, y el trabajo se les nota: armaron una plataforma completa, clara y bien cuidada, que une el inventario, la formación, las compras y el presupuesto del centro. Es un logro del que pueden estar orgullosos.

Puedes verlos, con su foto y su rol, en la página Equipo SIGMA. No hace falta iniciar sesión: abre /equipo, o entra por el menú Equipo Sigma de la página pública. En el pie de esa página también está el enlace Equipo de desarrollo.

El equipo es este:
Henry Bastidas, Product Owner.
Alex Jhoan Chaguendo, Tech Lead, Scrum Master y arquitecto de la solución.
Sofia Bonilla Gallego, Scrum Master, coordinadora del equipo y UI/UX.
María Paula Santacruz, desarrollo frontend web y móvil, y UI/UX.
Yusti Mebel Campo, desarrollo full stack.
Andres Mauricio Bustamante, desarrollo full stack y aseguramiento de calidad.`

export const TEXTO_NOTIFICACIONES = `La campana del encabezado es tuya: solo ves tus avisos, no los de otra persona. El número marca lo que no has leído. En Notificaciones puedes marcar todas como leídas, cargar más y abrir un aviso para ir al pedido relacionado. Nadie recibe aviso de lo que acaba de hacer. El administrador de la plataforma no recibe los avisos de bodega ni de las solicitudes de un centro.

Instructor. Le llega lo suyo: cuando bodega le entrega material o equipo, cuando registran la solicitud en el mostrador a su nombre, cuando reciben el equipo que devuelve y cuando el préstamo vence hoy o ya se pasó. En formación le llega la decisión del coordinador: qué se autorizó, qué se ajustó, qué se rechazó y qué sigue pendiente. No le llegan los pedidos de otras personas ni las alertas de stock.

Admin bodega. Le llegan los pedidos de material y de equipo de las bodegas que tiene asignadas, la alerta cuando un elemento llega al mínimo o se agota, y el aviso cuando entra existencia y todavía hay solicitudes esperando. Si una devolución vuelve dañada, perdida o en reparación, el resto de esa bodega también se entera. El préstamo vencido le llega al instructor y a quien recibe devoluciones en esa bodega.

Coordinador académico. Le llega el pedido de materiales de formación que envía un instructor de su red, para autorizar, ajustar o dejar pendiente cada línea. También le llega la vigencia especial, cuando hay un monto aparte del año para repartir en sus áreas.

Subdirectora y compras. La subdirectora asigna el monto del centro y compras arma el proceso con lo ya aprobado. Esas pantallas no tienen una campana propia. Cada persona ve en la campana solo lo que corresponde a su perfil y a su centro.

La alerta de inventario es otra pantalla: Inventario, Alertas. La ve quien administra la bodega. No es la campana.`

export const TEXTO_PERFILES = `Cada persona entra con un perfil, y ese perfil decide los menús y los botones. Si no ves una opción, tu perfil no la tiene: lo revisa el administrador en Perfiles y en Usuarios.

Administrador. Crea las bodegas, dice a qué centro pertenecen y las asigna a las cuentas. Mantiene usuarios, perfiles y permisos, y los catálogos que son iguales para todos los centros: categorías, subcategorías, clasificaciones, unidades, usos presupuestales y códigos UNSPSC. No atiende el mostrador ni las alertas de stock de un centro.

Admin bodega. Trabaja su centro y las bodegas que le asignaron. Crea ítems, elementos, stands y obras. Entrega solicitudes, recibe devoluciones y usa el mostrador cuando alguien llega sin la aplicación. Ve existencias y alertas. No crea bodegas, no cambia los catálogos compartidos y no pide material para sí.

Instructor. Pide material de consumo, equipo devolutivo y los materiales de sus programas. Ve el catálogo para pedir, no las existencias, ni el valor, ni el stand. Ve solo sus solicitudes y sus avisos. La devolución la registra bodega.

Coordinador académico. Ve programas, fichas, redes y líneas de su alcance. Autoriza o ajusta las solicitudes de materiales de formación y reparte los lotes y la vigencia especial en sus áreas.

Subdirectora. Asigna el monto único del centro en cada vigencia. Puede ver el presupuesto, las solicitudes de programa y las alertas de formación.

Compras. Arma y corrige la lista maestra y genera el proceso de compra con lo ya aprobado. No pide materiales de formación ni cambia precios, salvo que el administrador le agregue ese permiso.`

export const TEXTO_TECNOLOGIA = `La pantalla está hecha con React. El servidor es una API en AdonisJS 7 con TypeScript. Los datos se guardan en PostgreSQL y entras con un token de sesión. No comparto contraseñas, tokens, la conexión de la base ni ningún dato del centro: el inventario y las categorías los ves tú, según el perfil que tengas asignado.`

export const GUIAS_ASISTENTE: Array<{ titulo: string; modulo: string; contenido: string }> = [
  {
    titulo: 'Cómo funciona SIGMA',
    modulo: 'General',
    contenido:
      'SIGMA es la plataforma de gestión del centro. Entras en Iniciar sesión con tu correo o tu número de documento y tu contraseña. Después llegas a Inicio: ahí están las tarjetas de los módulos que tu perfil tiene asignados. El menú de la izquierda muestra esas mismas secciones. El encabezado tiene la fecha, la campana de notificaciones y tu cuenta.',
  },
  {
    titulo: 'Inicio y módulos disponibles',
    modulo: 'Inicio',
    contenido:
      'En Inicio ves el saludo, tu centro y la sección Módulos disponibles. Cada tarjeta tiene Abrir módulo. Solo salen los módulos de tu perfil. Si falta uno, no está asignado a tu perfil.',
  },
  {
    titulo: 'Si no te aparece un menú o un botón',
    modulo: 'Permisos',
    contenido:
      'Si no te aparece un menú, un botón, una pantalla o una acción, lo más probable es que tu perfil no tenga ese permiso. El administrador de SIGMA asigna módulos en Perfiles y cuentas en Usuarios. Contacta al administrador de SIGMA y dile qué opción no ves y con qué perfil entras.',
  },
  {
    titulo: 'Inventario según tu permiso',
    modulo: 'Inventario',
    contenido:
      'Inventario se abre desde el menú Inventario. Quien solo solicita ve los elementos disponibles para solicitar, el acceso a solicitudes y las alertas. Quien administra la bodega ve el resumen, las categorías, los accesos rápidos y los últimos movimientos. Las alertas de stock están en Inventario, Alertas.',
  },
  {
    titulo: 'Bodegas y subbodegas',
    modulo: 'Inventario',
    contenido:
      'Las bodegas están en Inventario, Bodegas. Puedes buscar, ver, editar y crear una bodega. Dentro de la bodega se crean y editan las subbodegas. Una bodega que todavía tiene subbodegas no se elimina. Hace falta el permiso de bodegas.',
  },
  {
    titulo: 'Stands del inventario',
    modulo: 'Inventario',
    contenido:
      'Los stands están en Inventario, Stands, o dentro de una subbodega. Creas el stand con su nombre y su subbodega. Al abrirlo ves los elementos que tiene. Si el stand tiene elementos, no se puede eliminar.',
  },
  {
    titulo: 'Ítems del catálogo',
    modulo: 'Inventario',
    contenido:
      'Los ítems son las fichas de producto, no el stock. Están en Inventario, Ítems. Con Nuevo ítem registras nombre, categoría y los datos del catálogo. El buscador filtra por nombre, descripción o categoría. En la fila puedes ver, editar o inhabilitar el ítem.',
  },
  {
    titulo: 'Categorías y subcategorías',
    modulo: 'Inventario',
    contenido:
      'Las categorías del catálogo están en Inventario, Categorías. Con Nueva categoría creas la categoría. En la fila abres Subcategorías para crearlas y editarlas. También puedes ver el detalle, editar la categoría o inhabilitarla. Sin el permiso de categorías esa pantalla no aparece.',
  },
  {
    titulo: 'Cómo subir elementos por Excel',
    modulo: 'Inventario',
    contenido:
      'La carga masiva de stock está en Inventario, Elementos. Pulsa Descargar plantilla, llena el archivo y luego Subir Excel. El archivo debe ser .xlsx o .xls. No borres la fila 1: ahí están los encabezados. Una fila es un elemento. Columnas: Nombre, Código interno, Ítem, Stand, Cantidad, Cantidad mínima, Unidad de medida, Clasificación, Carácter, Estado, Código UNSPSC, Uso presupuestal, Marca, Color, Gramaje, Descripción, Valor unitario y Porcentaje de aumento. Ítem, Stand, Unidad de medida, Clasificación, Carácter y Estado se eligen de la lista y son obligatorios. Código UNSPSC y Uso presupuestal pueden quedar vacíos. Nombre y Código interno los escribes tú; el código interno no se repite. La cantidad inicial debe ser 10 o más. Carácter es Consumo o Devolutivo. Estado es Activo o Inactivo. Deja vacías las filas que no uses. Si una fila falla, el sistema dice cuál es. También puedes crear un elemento con Nuevo elemento, sin Excel. Para sacar el listado, elige los campos y exporta a Excel o PDF.',
  },
  {
    titulo: 'Elementos del inventario',
    modulo: 'Inventario',
    contenido:
      'Los elementos son el stock físico: código, ubicación y cantidad. Están en Inventario, Elementos. Nuevo elemento pide código, cantidad y ubicación (bodega, subbodega y stand). En cada fila puedes ver, editar o inhabilitar. Desde aquí también se descarga la plantilla, se sube el Excel y se exporta el listado.',
  },
  {
    titulo: 'Catálogo del centro',
    modulo: 'Inventario',
    contenido:
      'El catálogo del centro tiene cuatro listas. Clasificaciones en Inventario, Clasificaciones. Unidades de medida en Inventario, Unidades. Usos presupuestales en Inventario, Usos presupuestales. Códigos estándar UNSPSC en Inventario, Códigos estándar. En cada lista puedes buscar, crear con el botón de alta y editar la fila.',
  },
  {
    titulo: 'Obras y ubicaciones',
    modulo: 'Inventario',
    contenido:
      'Las obras registran un espacio del centro, por ejemplo un ambiente o una sede. Están en Inventario, Obras. Creas la obra, la buscas por nombre o lugar, la editas o la inhabilitas. SIGMA no tiene un módulo de proyectos: la obra es el registro de ubicación.',
  },
  {
    titulo: 'Tablero de bodega',
    modulo: 'Inventario',
    contenido:
      'El tablero de bodega muestra indicadores de devoluciones, préstamos, solicitudes, rotación, entregas por mes y stock bajo. Es la vista de quien administra la bodega. Se abre en Inventario, Tablero.',
  },
  {
    titulo: 'Alertas de inventario',
    modulo: 'Inventario',
    contenido:
      'Las alertas de stock están en Inventario, Alertas. Ves agotados, críticos, bajos, activas y cerradas. Puedes filtrar por nombre, código, tipo, estado y fechas. Ver elemento abre el elemento. La alerta se cierra sola cuando se repone el stock; no hay un cierre manual.',
  },
  {
    titulo: 'Cómo pedir un material',
    modulo: 'Solicitudes',
    contenido:
      'Hay dos pedidos distintos. En inventario, el material de consumo se pide en Inventario, Solicitudes, Material de consumo: Nueva solicitud, agregas los materiales y queda pendiente. No descuenta stock hasta que alguien lo entrega en la pestaña Entregar. En formación, el instructor pide en Formación, Solicitudes: Nueva solicitud, elige los materiales, confirma ficha, programa y lote, y el pedido queda enviado para que el coordinador lo autorice. Si no hay stock en inventario, la solicitud queda pendiente.',
  },
  {
    titulo: 'Cómo solicitar un equipo devolutivo',
    modulo: 'Solicitudes',
    contenido:
      'El equipo que se devuelve se pide en Inventario, Solicitudes, Equipo devolutivo. En Solicitar pulsas Nueva solicitud y agregas elementos, obra y cantidad. Al guardar queda Pendiente y todavía no descuenta stock. Quien entrega usa la pestaña Entregar, por línea o con Entregar todo lo disponible, y define la fecha límite de devolución. Los estados van de pendiente a parcial, entregado y cerrado.',
  },
  {
    titulo: 'Entregas préstamos y devoluciones',
    modulo: 'Solicitudes',
    contenido:
      'Entregas y devoluciones está en Inventario, Solicitudes. Agrupa por persona: quién tiene equipo afuera, cuántas unidades y qué pedidos están vencidos. Puedes ver la solicitud, cambiar la fecha límite y recibir la devolución. Al recibir, marcas cada unidad como buena, dañada, perdida o en reparación. Las que vuelven en buen estado regresan al stock.',
  },
  {
    titulo: 'Centro de solicitudes',
    modulo: 'Solicitudes',
    contenido:
      'Inventario, Solicitudes reúne Equipo devolutivo, Material de consumo y Entregas y devoluciones, según tu permiso. La tabla Todas las solicitudes filtra por Todas, Pendiente, Entrega parcial, Entregado y Cerrado. Arriba están Registrar en mostrador y Nueva solicitud.',
  },
  {
    titulo: 'Materiales de formación y mis programas',
    modulo: 'Formación',
    contenido:
      'Materiales de formación muestra Mis programas. Cada programa tiene Lista de materiales si tu perfil lo permite. El menú solo sale para instructor, coordinador o un perfil con permisos de materiales.',
  },
  {
    titulo: 'Programas de formación',
    modulo: 'Formación',
    contenido:
      'Los programas están en Formación, Programas. Creas o editas nivel, red de conocimiento, línea temática y duración. Desde la fila abres la lista de materiales, editas el programa o lo desactivas.',
  },
  {
    titulo: 'Fichas de formación',
    modulo: 'Formación',
    contenido:
      'Las fichas están en Formación, Fichas. Buscas por número de ficha, programa, centro o jornada. Al crear eliges número, programa, centro y jornada. En la fila puedes ver, editar o deshabilitar la ficha.',
  },
  {
    titulo: 'Redes de conocimiento',
    modulo: 'Formación',
    contenido:
      'Las redes están en Formación, Redes. Buscas por nombre, gestor, asesor o línea temática. Creas la red con nombre, gestor y asesor. En la fila puedes editarla o eliminarla.',
  },
  {
    titulo: 'Líneas temáticas',
    modulo: 'Formación',
    contenido:
      'Las líneas temáticas agrupan programas dentro de una red. Están en Formación, Líneas temáticas. Creas la línea y la asocias a su red. En la fila puedes editarla o eliminarla.',
  },
  {
    titulo: 'Niveles de programa',
    modulo: 'Formación',
    contenido:
      'Los niveles, como técnico o tecnólogo, están en Formación, Niveles. Puedes buscar, crear, editar y eliminar. Eliminar pide confirmación.',
  },
  {
    titulo: 'Asignar programas a instructores',
    modulo: 'Formación',
    contenido:
      'Solo el administrador asigna programas en Formación, Instructores. Busca al instructor por nombre, correo o programa. Pulsa Asignar programas, busca el programa por código o nombre y guarda.',
  },
  {
    titulo: 'Cómo subir materiales de formación por Excel',
    modulo: 'Formación',
    contenido:
      'La lista de materiales de un programa está en Formación, Lista de materiales. Descargar plantilla baja el Excel del programa. Llénalo y pulsa Subir Excel. Acepta .xlsx y .xls. No borres la fila 8 de encabezados. Una fila es un material. Columnas: ITEM, CÓDIGO UNSPSC, PRODUCTO, DESCRIPCIÓN TÉCNICA, UNIDAD DE MEDIDA, VALOR UNITARIO, LOTE, CANTIDAD REQUERIDA PARA FORMAR 30 APRENDICES, OBSERVACIONES y CARÁCTER. Código UNSPSC y producto son obligatorios. La cantidad es la necesaria para formar 30 aprendices. Código UNSPSC, unidad, lote y carácter se eligen de la lista: no escribas un código que no esté ahí. Carácter es Consumo, Devolutivo o Software. El valor unitario es el precio de una unidad. Las filas vacías se dejan en blanco y no se combinan celdas. Si el Excel deja filas pendientes, el sistema las muestra y puedes agregarlas con Agregar material. Agregar material también sirve para cargar uno a uno, con UNSPSC, unidad, lote y cantidad. En la fila puedes editar o eliminar un material.',
  },
  {
    titulo: 'Solicitar materiales de formación',
    modulo: 'Formación',
    contenido:
      'El instructor arma el pedido en Formación, Solicitudes, con Nueva solicitud. Elige los materiales, confirma ficha, programa y lote, y el pedido queda enviado. El coordinador después autoriza o rechaza cada línea. Los estados del pedido son enviada, parcial y anulada. Cada material pasa de pendiente a aprobado o rechazado.',
  },
  {
    titulo: 'Autorizar materiales y compras',
    modulo: 'Formación',
    contenido:
      'El coordinador abre Formación, Solicitudes, Revisar pedido. En Autorizar materiales puede Autorizar ahora, No autorizar o dejar la línea pendiente. También está Autorizar todo lo pendiente y Entregar lo pendiente. Las compras están en Formación, Compras: eliges la vigencia, descargas el consolidado en Excel o PDF, o generas el proceso de compra con lo aprobado.',
  },
  {
    titulo: 'Alertas de materiales de formación',
    modulo: 'Formación',
    contenido:
      'Las alertas de formación muestran, por programa, si se pasan, si están cerca del tope o si están en alerta. Se consultan desde Formación. Hace falta permiso para autorizar solicitudes de programa.',
  },
  {
    titulo: 'Perfiles módulos y permisos',
    modulo: 'Administración',
    contenido:
      'Solo el administrador entra a Perfiles. Crea el perfil con nombre y descripción. En Asignar módulos marca el árbol y, en cada módulo, Permisos para ver, crear, editar o eliminar. Guarda. Esos permisos deciden qué menús ve cada usuario. Si a alguien no le aparece una opción, se revisa aquí.',
  },
  {
    titulo: 'Usuarios y cuentas',
    modulo: 'Administración',
    contenido:
      'Solo el administrador entra a Usuarios. Nuevo usuario pide nombres, apellidos, tipo y número de documento, correo, contraseña, perfil y centro de formación. Si el perfil es instructor o coordinador, se le asignan programas. Al terminar se le puede asignar una bodega. La fila permite editar la cuenta.',
  },
  {
    titulo: 'Notificaciones',
    modulo: 'Cuenta',
    contenido: TEXTO_NOTIFICACIONES,
  },
  {
    titulo: 'Mi perfil y contraseña',
    modulo: 'Cuenta',
    contenido:
      'En Mi perfil editas nombres, apellidos, documento y correo. También puedes subir o quitar la foto. Para cambiar la contraseña estando dentro, usa Cambiar contraseña: escribes la contraseña actual, la nueva y la confirmación. La nueva debe tener entre 8 y 32 caracteres y ser distinta a la actual. Si no recuerdas la actual, no se cambia desde aquí: usa Recuperar contraseña en la pantalla de iniciar sesión.',
  },
  {
    titulo: 'Cómo recuperar la contraseña',
    modulo: 'Acceso',
    contenido:
      'Si olvidaste la contraseña, en Iniciar sesión pulsa ¿Olvidaste tu contraseña? También está el enlace Recuperar mi contraseña. Escribe el correo de tu cuenta y pulsa Enviar código. Si ese correo es de una cuenta activa, llega un código de 6 dígitos. El código vence a los 10 minutos. Escríbelo y pulsa Verificar código. Después crea la nueva contraseña, confírmala y pulsa Cambiar contraseña. Debe tener entre 8 y 32 caracteres. Al terminar, pulsa Ir a iniciar sesión y entra con la contraseña nueva. Si el código no llega o dice que no es válido o ya expiró, pulsa Empezar de nuevo y pide otro. Si la cuenta está inactiva, el código no se envía: contacta al administrador de SIGMA.',
  },
  {
    titulo: 'Vigencias presupuestales',
    modulo: 'Gestión',
    contenido:
      'Las vigencias están en Vigencias. Buscas por año y filtras Activa o Inactiva. Nueva vigencia la crea el administrador o el subdirector, con apertura y cierre. Editar exige el permiso de editar vigencia. Eliminar pide confirmación. También existe la vigencia especial para casos aparte del año normal.',
  },
  {
    titulo: 'Presupuesto de formación',
    modulo: 'Gestión',
    contenido:
      'El presupuesto está en Presupuesto. Tiene el resumen, el monto del centro para la vigencia, el reparto entre redes o coordinadores y los lotes de la vigencia. Desde ahí se descarga el consolidado en Excel o PDF.',
  },
  {
    titulo: 'Reportes Excel y PDF',
    modulo: 'Reportes',
    contenido:
      'En Reportes, Materiales de mi bodega exporta a Excel o PDF los campos que elijas. Hace falta el permiso de generar reporte y tener bodegas asignadas. Inventario completo lleva a Inventario, Elementos, y desde ahí se exporta el listado. Residuos del mes y Actividades en curso están marcados como no disponibles. Compras y presupuesto tienen su propia descarga de Excel o PDF.',
  },
  {
    titulo: 'Actividades del centro',
    modulo: 'Actividades',
    contenido:
      'Actividades tiene las pestañas Todos, En curso y Realizados, un buscador y Crear nueva actividad con título, fecha, responsable y estado. Hoy esa pantalla usa datos de demostración en el navegador: no guarda las actividades en el servidor.',
  },
  {
    titulo: 'Gestión ambiental',
    modulo: 'Ambiental',
    contenido:
      'Gestión ambiental tiene Residuos, Consumos, Reportes y Configuración. Nuevo registro pide fecha, tipo, cantidad y estado. Hoy esa pantalla usa datos de demostración en el navegador: no guarda los registros en el servidor.',
  },
  {
    titulo: 'Dónde está cada módulo',
    modulo: 'General',
    contenido:
      'Inicio es el panel. Inventario concentra bodegas, stands, ítems, elementos, categorías, obras, solicitudes y alertas. Formación concentra programas, fichas, redes, líneas, niveles, listas de materiales, solicitudes y compras. Vigencias y Presupuesto están en el menú de gestión. Reportes exporta. Mi perfil y Notificaciones son de tu cuenta. Perfiles, Usuarios y Guías del asistente solo los ve el administrador. Solo verás las rutas que tu perfil tenga asignadas.',
  },
  {
    titulo: 'SIGMA no crea proyectos',
    modulo: 'General',
    contenido:
      'SIGMA no tiene un módulo para crear proyectos. No hay botón ni permiso de proyectos. Lo más cercano es Obras, en Inventario, para registrar un espacio o una sede, y Actividades, que hoy es una pantalla de demostración.',
  },
  {
    titulo: 'Qué sabe este asistente',
    modulo: 'Asistente',
    contenido:
      'El asistente saluda por tu nombre y explica cómo se usa SIGMA: módulos, solicitudes, formación, notificaciones, perfiles y el equipo que la creó. No modifica datos: no crea, no aprueba y no borra registros. No lista inventario, categorías, existencias, usuarios ni montos, porque no tiene permiso para ese tipo de respuesta: eso lo ves tú según lo que tu perfil tenga asignado. Si no tiene una guía del tema, lo dice. El administrador puede corregir o apagar una guía en Guías del asistente, y al apagarla el asistente deja de usarla.',
  },
  {
    titulo: 'Quién creó SIGMA',
    modulo: 'General',
    contenido: TEXTO_EQUIPO,
  },
  {
    titulo: 'Qué hace cada perfil',
    modulo: 'Administración',
    contenido: TEXTO_PERFILES,
  },
  {
    titulo: 'Con qué está hecha SIGMA',
    modulo: 'General',
    contenido: TEXTO_TECNOLOGIA,
  },
  {
    titulo: 'Registrar en mostrador',
    modulo: 'Solicitudes',
    contenido:
      'El mostrador está en Inventario, Solicitudes, Registrar en mostrador. Lo usa quien entrega en bodega, cuando la persona llega sin entrar a la aplicación. Se busca por número de documento del centro. Si la cuenta está activa, se elige material de consumo o equipo devolutivo, según lo que ese perfil pueda pedir. Al guardar, la solicitud queda a nombre de esa persona: ella la ve en sus solicitudes y le llega el aviso. El administrador de la plataforma y el instructor no registran en mostrador.',
  },
]
