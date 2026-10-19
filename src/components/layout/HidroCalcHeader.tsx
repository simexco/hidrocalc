"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { HelpButton } from "@/components/ui/HelpModal";
import { GlossaryButton } from "@/components/ui/GlossaryModal";

const moduleNames: Record<string, string> = {
  "/asistente": "Asistente de proyecto",
  "/demanda": "Cálculo de gasto",
  "/tramo-simple": "Verificar presión",
  "/perfil": "Línea de conducción",
  "/impulsion": "Cálculo de diámetro económico",
  "/equipo-bombeo": "Equipo de bombeo",
  "/golpe-ariete": "Golpe de ariete",
  "/dimensionamiento": "Elegir diámetro",
  "/conversor": "Conversor de unidades",
  "/despiece": "Generador de cruceros",
  "/valvulas-aire": "Válvulas de aire",
  "/vrp": "Válvula reductora",
  "/entregable": "Reporte de proyecto",
  "/proyectos": "Mis proyectos",
  "/cuenta": "Mi cuenta",
};

const moduleHelp: Record<string, { title: string; sections: { title: string; content: string }[] }> = {
  "/tramo-simple": {
    title: "Verificar presión — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para revisar UN tramo de tubo sencillo (mismo diámetro y material de principio a fin): ¿llega la presión al final? ¿cuánta agua puede pasar? Si tu línea cambia de diámetro o cruza lomas y barrancas, es mejor usar Línea de conducción." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- Caudal (Q): cuánta agua va a pasar, en litros por segundo. Si ya hiciste el Cálculo de gasto, usa ese QMD — cópialo aquí, porque en este módulo el dato no se llena solo.\n- Diámetro nominal (DN): el tamaño del tubo en milímetros. Viene impreso en el propio tubo o en la factura de compra; también puedes elegirlo con los botones de medidas comerciales que aparecen bajo el campo.\n- Longitud de la tubería (L): los metros de tubo de inicio a fin. Si no la tienes, traza la ruta en Google Earth y copia la distancia.\n- Material y clase de tubería: elige el material de la lista (si no lo sabes, deja el que aparece) y selecciona la clase — ese campo se marca en amarillo hasta que la elijas, y con ella la app verifica que el tubo resista la presión.\n- Presión inicial (P₁): con cuánta presión inicia el tramo. Si sale de un tanque elevado: desnivel en metros ÷ 10 (un tanque 30 m arriba da 3 kg/cm2). Si la línea ya existe, se mide con un manómetro. Es el único dato que puedes dejar vacío: la app calcula velocidad y pérdidas, pero no la presión final.\n- Los datos obligatorios que falten se marcan en amarillo y el cálculo no aparece hasta llenarlos. Las cotas del terreno (en parámetros avanzados) sí tienen valor por defecto y se marcan como «supuesto»." },
      { title: "Los 3 modos (elige tu pregunta)", content: "En la parte superior hay tres botones:\nModo A — Verificar presión de salida: ¿la presión llega al final? Captura el caudal, el tubo y la longitud; si además capturas P₁, obtienes la presión final.\nModo B — Calcular caudal máximo: ¿cuánta agua puede pasar sin bajar de presión? Captura el tubo, la longitud, P₁ y la presión final mínima (el campo de caudal se oculta en este modo).\nModo C — Recomendar diámetro: ¿qué diámetro necesito? Captura el caudal y la longitud (el campo de diámetro se oculta); la tabla compara todos los diámetros comerciales y marca en verde el recomendado." },
      { title: "¿Cómo leo el resultado?", content: "Presión final (P₂): debe ser de al menos 1.0 kg/cm2 (lo que exige CONAGUA). Solo se calcula si capturaste la presión inicial P₁.\nVelocidad del agua (V): adecuada entre 0.3 y 2.5 m/s — si queda fuera de ese rango, la app te avisa; en el Modo C la tabla te muestra qué diámetros sí cumplen.\nSi elegiste la clase de tubería, la app te alerta en rojo cuando la presión capturada excede lo que esa clase resiste.\nAdemás puedes ver el perfil hidráulico, revisar el detalle de las fórmulas (Modo A), exportar el resultado a PDF y armar la lista de materiales SIMEX del tramo.\nSi algo aparece en rojo, la app indica QUÉ cambiar. Los términos poco comunes están en el Diccionario (arriba a la derecha)." },
    ],
  },
  "/golpe-ariete": {
    title: "Golpe de ariete — Guía de uso",
    sections: [
      { title: "¿Qué es y cuándo usar?", content: "Cuando el agua se detiene de golpe (se cierra una válvula o se apaga la bomba), la tubería recibe una sacudida de presión adicional. Este módulo revisa si tu tubería la resiste. Úsalo SIEMPRE que la línea sea de bombeo; en gravedad, cuando haya válvulas que cierren rápido." },
      { title: "Buena noticia: casi todo se llena automáticamente", content: "Si ya capturaste la Línea de conducción (paso 2 del Asistente), la tubería, el caudal, la presión y la longitud llegan AUTOMÁTICAMENTE a este módulo. Si cambiaste algo después, pulsa el botón «Traer datos del proyecto» y se vuelven a cargar. No tienes que ir a buscar nada a otro módulo." },
      { title: "El único dato nuevo: tiempo de cierre (Tc)", content: "Es el número de segundos que tarda en detenerse el flujo: el cierre de la válvula o, en una línea de bombeo, el paro de la bomba. ¿De dónde lo obtengo?\n- De la ficha técnica de la válvula (solicítala al proveedor)\n- ¿No lo tienes? Déjalo en 0 s, que es como inicia: la app supone el caso MÁS desfavorable (cierre instantáneo), que es lo seguro. Si conoces el cierre real, hay botones rápidos: «Instantáneo (0 s)» y «Cierre manual (~5 s)»\n- Si tu línea es de bombeo, marca la casilla «Línea por bombeo» (viene marcada si tu proyecto incluye bombeo): ahí el golpe lo dispara el paro de la bomba, no una válvula, y la app te ofrece el botón «Usar paro súbito (1 s)», el peor caso por corte de energía\n- Regla práctica: cerrar lento suaviza el golpe; por eso las válvulas grandes se cierran despacio" },
      { title: "Paso a paso", content: "1. Entra desde el Asistente: caudal, tubería, presión y longitud ya vienen llenos (si cambiaste algo después, pulsa «Traer datos del proyecto»)\n2. Revisa que la tubería mostrada sea la de tu proyecto (tipo, diámetro y clase); si no aparece en el catálogo, usa la opción de capturar el diámetro y el espesor manualmente\n3. Revisa el Tiempo de cierre (Tc) y, si la línea es de bombeo, confirma que la casilla «Línea por bombeo» esté marcada\n4. Observa el Semáforo de protección: verde — tu tubería absorbe el golpe; amarillo — zona de precaución; rojo — se requiere protección\n5. Si sale rojo, la app te da dos opciones: subir a la clase de tubería que sí resiste, o agregar la válvula de protección que te recomienda (con su tamaño y el punto donde instalarla)\n6. Si aparece presión negativa, se requieren ventosas en los puntos altos — un botón te lleva al módulo Válvulas de aire\nNo necesitas entender las fórmulas: el detalle técnico queda oculto y el semáforo es el resultado" },
      { title: "¿Cómo leo el resultado?", content: "Verde — tu tubería absorbe el golpe: la clase elegida resiste la sobrepresión con margen; no necesitas válvula.\nAmarillo — zona de precaución: el golpe queda cerca del límite de tu clase; revisa el cierre o considera subir de clase como margen de seguridad. Aún no es obligatoria una válvula.\nRojo — se requiere protección: el golpe supera lo que aguanta tu tubería; sube de clase (pared más gruesa), cambia de material o agrega la válvula de protección que la app recomienda.\nPresión negativa: riesgo de que el tubo se aplaste por vacío — se recomiendan ventosas (válvulas de admisión de aire) en los puntos altos.\nFactor de seguridad 1.5 = queda un 50% de margen (lo recomendado en agua potable).\n¿Un término no te resulta familiar? Está en el Diccionario (arriba a la derecha)." },
    ],
  },
  "/equipo-bombeo": {
    title: "Equipo de bombeo — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para predimensionar la bomba de un sistema: obtener la Carga Dinámica Total (CDT) y la potencia de referencia (HP) con las que se solicita cotización a un proveedor de bombas." },
      { title: "Los dos casos", content: "CASO 1 — Pozo → Tanque: la bomba está dentro de un pozo y eleva el agua a un tanque. La succión es el NIVEL DINÁMICO del agua (no la profundidad de la bomba).\n\nCASO 2 — Tanque → Red / otro tanque: la bomba toma de un tanque y envía a la red o a otro tanque. Permite varios equipos en paralelo (1, 1+1, 2+1) y elegir el tipo de bomba." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- Cotas de succión y entrega: si ya capturaste el perfil del terreno en la Línea de conducción, llegan AUTOMÁTICAMENTE (la cota inicial como succión y la final como entrega) y puedes ajustarlas. Si no tienes proyecto, ubica cada punto en Google Earth y lee la elevación que aparece en la parte inferior (en metros).\n- Si es POZO: el nivel dinámico — la profundidad a la que queda el agua MIENTRAS se bombea. Lo indica el aforo del pozo (reporte del perforador); no es la profundidad de la bomba. También se pide la profundidad de instalación de la bomba, que debe quedar por debajo del nivel dinámico.\n- Caudal, diámetro, material y longitud: llegan AUTOMÁTICAMENTE del proyecto si ya hiciste los pasos 1 y 2 del Asistente — se marcan con la etiqueta «datos del proyecto» y puedes editarlos.\n- Presión de servicio: 0 si solo llenas un tanque; de 15 a 20 m.c.a. (equivalente a 1.5 a 2.0 kg/cm2) si entregas directamente a una red. La pantalla permite capturarla en m.c.a. o en kg/cm2." },
      { title: "Paso a paso", content: "1. Elegir el caso: Caso 1 (pozo → tanque) o Caso 2 (tanque → red u otro tanque)\n2. Fuente (succión): en pozo, revisar la cota del terreno, el nivel dinámico y la profundidad de instalación de la bomba; en tanque, la cota de desplante del tanque de origen — si hay proyecto activo, las cotas ya vienen prellenadas desde el perfil\n3. Línea de impulsión: verificar el caudal (Q), el diámetro nominal (DN), el material y la longitud de la tubería (L) — vienen llenos del proyecto con la etiqueta «del proyecto» y se pueden corregir\n4. Entrega (descarga): revisar la cota del punto de entrega e indicar la presión de servicio requerida\n5. Solo en el Caso 2: elegir el número de equipos en paralelo (1, 1+1 o 2+1) y el tipo de equipo de bombeo\n6. Leer los 4 datos para cotizar: carga dinámica total (CDT), gasto total, gasto por bomba y potencia por bomba (HP) — y atender las advertencias en ámbar si aparecen\n7. Opcional: desplegar «Ver costo estimado de operación (energía)» para estimar el consumo eléctrico y el costo mensual y anual del bombeo" },
      { title: "Interpretación", content: "CDT = carga estática + fricción + pérdidas locales + presión de servicio.\nLa potencia mostrada es el HP comercial inmediato superior (eficiencia 70% por defecto).\nEl par Q + CDT es lo que el proveedor necesita para proponer el modelo definitivo.\nVelocidad recomendada en la línea: 0.3 a 2.5 m/s." },
    ],
  },
  "/bombeo": {
    title: "Punto de operación — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Cuando ya tienes la FICHA TÉCNICA de una bomba y quieres saber a qué caudal y presión va a trabajar realmente en TU línea (no en el laboratorio del fabricante)." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- La curva de la bomba: la tabla o gráfica Q-H que viene en la ficha técnica — solicítala al proveedor de la bomba; es un dato suyo, no tuyo\n- Desnivel a vencer (Hg): la diferencia de elevación entre la succión y el punto de entrega (cotas de Google Earth)\n- El tubo: longitud (L), diámetro nominal (DN), material y clase de tubería — del proyecto o de la factura. Con la clase, la app verifica que el tubo resista la presión de operación\n- ¿Todavía no tienes la curva? Usa primero Equipo de bombeo: con Q y CDT el proveedor te propone el modelo, y con su ficha regresas aquí a verificar" },
      { title: "Paso a paso", content: "1. Ingresa el desnivel a vencer (Hg) y la longitud de la tubería (L)\n2. Elige el diámetro nominal (DN), el material y la clase de tubería — con la clase, la app verifica que el tubo resista la presión\n3. Si necesitas presión en la entrega, pulsa «Mostrar parámetros avanzados» e ingresa la presión remanente (P2); la app la suma al desnivel (Hs = Hg + P2×10)\n4. En «Bomba» elige cómo capturar la curva:\n   - Ecuación: ingresa la carga de la bomba a caudal cero (H₀) y el coeficiente de la curva (K), ambos de la ficha técnica\n   - Puntos: ingresa de 3 a 8 pares Q-H del fabricante con el botón «+ Punto»\n5. Los resultados aparecen automáticamente: el gráfico muestra la intersección de las curvas y, en grande, el punto de operación (caudal y carga)\n6. Revisa la Recomendación de Bomba: tipo, potencia, eficiencia mínima, velocidad de giro y carga de succión requerida (NPSH)" },
    ],
  },
  "/dimensionamiento": {
    title: "Dimensionamiento — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Cuando no sabes qué tamaño de tubo elegir: la app prueba TODOS los diámetros comerciales con tu caudal y marca en verde los que funcionan. Tú solo eliges el más pequeño de los verdes (el más económico que cumple)." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- Caudal de diseño (Q): usa el QMD que obtuviste en el Cálculo de gasto — esta pantalla no lo trae automáticamente, cópialo tú (puedes capturarlo en L/s, m³/h o m³/s)\n- Longitud de la tubería (L): metros de tubo — mídelos en Google Earth si no los tienes\n- Material y clase de tubería: si no lo sabes, deja PVC Inglés y selecciona una clase de la lista — el campo se marca en amarillo hasta que la elijas, y sirve para verificar que el tubo resista la presión\n- Presión inicial (P₁): si no la conoces, déjala vacía; la tabla mostrará velocidades y pérdidas de todos modos, solo que sin verificar la presión de salida\n- Lo demás (presión final mínima, velocidad máxima, elevaciones) está en «parámetros avanzados» y ya trae valores por defecto que puedes dejar como están" },
      { title: "Paso a paso", content: "1. Captura el caudal de diseño (Q) y la longitud de la tubería (L): son los dos datos obligatorios y aparecen en amarillo mientras falten\n2. Deja el material como está (PVC Inglés), salvo que tu proyecto requiera otro, y selecciona la clase de tubería para verificar que resista la presión\n3. Si conoces la presión inicial (P₁), captúrala: así la tabla también verifica la presión de salida\n4. La tabla aparece automáticamente en cuanto hay caudal y longitud\n5. Elige el DN más pequeño que cumpla todo: viene resaltado en verde con la etiqueta «REC»\n6. Usa ese diámetro en la Línea de conducción (puedes exportar la tabla a CSV o el cálculo a PDF)" },
      { title: "Interpretación de la tabla", content: "V min: velocidad >= 0.3 m/s (sin sedimentación)\nV max: velocidad <= la velocidad máxima definida, 2.5 m/s por defecto (sin erosión)\nJ: pérdida por fricción <= 10 m/km (límite de CONAGUA)\nPres.: P2 calculada >= P2 mínima — esta columna solo aparece si capturaste P₁\nEstado OK: cumple todos los criterios anteriores\nREC: el DN más pequeño que cumple todo\nAsterisco amarillo en V: velocidad entre 0.3 y 0.5 m/s — cumple el mínimo, pero queda debajo del óptimo" },
    ],
  },
  "/valvulas-aire": {
    title: "Válvulas de Aire — Guía de uso",
    sections: [
      { title: "¿Qué es y cuándo usar?", content: "En toda línea se acumula aire en las partes ALTAS del trazo (como la burbuja en una manguera). Si no se extrae, obstruye el paso del agua; y al vaciar la línea, si no entra aire, el tubo se puede aplastar. Este módulo te indica DÓNDE colocar cada válvula de aire y de qué tamaño." },
      { title: "Buena noticia: los datos llegan automáticamente", content: "El perfil del terreno, el caudal y el tubo llegan AUTOMÁTICAMENTE desde la Línea de conducción (paso 2 del Asistente), siempre que no hayas capturado datos propios en este módulo. Si entras directamente sin proyecto, captura el terreno con «+ Agregar cota»: cada fila es un punto, con su distancia acumulada desde el inicio y su elevación (cota). Si prefieres importar el perfil desde Excel, hazlo en la Línea de conducción y los datos llegan aquí solos. Si no conoces el caudal o la presión de operación, déjalos vacíos: las válvulas se ubican únicamente por la geometría del terreno." },
      { title: "Tipos de válvulas (la app los elige por ti)", content: "VA-C (combinada): al inicio de la línea y en los puntos altos del trazo — expulsa y admite aire\nVA-A (admisión/expulsión): en bajadas pronunciadas y en tramos largos en descenso — evita que el tubo se aplaste al vaciarlo\nVA-E (eliminadora): en tramos largos planos o en subida, y donde la subida cambia de pendiente — expulsa el aire que se acumula durante la operación\nNo tienes que decidirlo tú: la app indica cuál va en cada punto y de qué tamaño." },
      { title: "Paso a paso", content: "1. Verifica los datos globales: caudal (Q), diámetro nominal (DN) y material — llegan solos del proyecto si vienes del Asistente\n2. Selecciona la clase de tubería (el campo se marca en AMARILLO mientras falte): con ella la app verifica que el tubo resista la presión\n3. Revisa que el perfil esté completo (que no falte ninguna loma ni barranca del trazo); agrega puntos con «+ Agregar cota»\n4. Los resultados aparecen automáticamente: tarjetas de totales, dibujo del perfil y tabla de válvulas recomendadas\n5. Los puntos BAJOS no llevan válvula de aire: la app recomienda ahí un desagüe para drenar\n6. Las válvulas pasan automáticamente al reporte final; también puedes descargar el PDF de este módulo con el botón Exportar" },
      { title: "Interpretación", content: "VA-C azul: ubicación crítica — instalación obligatoria\nVA-A amarilla: necesaria para vaciado seguro\nVA-E verde: mantenimiento de aire en operación\nFila con fondo rojo: presión NEGATIVA en ese punto — las válvulas de aire no lo corrigen; hay que revisar el diseño\nFila con fondo amarillo: presión por debajo del mínimo — verificar con el fabricante que la válvula selle a baja presión\nEn el dibujo, la línea punteada de presión nunca debe ser negativa ni caer por debajo de la línea de Presión mínima (Pmin)" },
    ],
  },
  "/perfil": {
    title: "Línea de conducción — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para diseñar una línea completa: de conducción, de impulsión o la red de distribución — la pantalla te deja elegir qué diseñas y trae el caudal correcto del proyecto. Cargas el perfil topográfico, defines los tramos de tubería (diámetro, material y clase) y el módulo calcula AUTOMÁTICAMENTE la presión en cada punto y la presión de entrada (P1) requerida para que todo cumpla. También puedes comparar dos escenarios de tubería. Para revisar una línea que ya existe y conoces su presión de entrada, usa la herramienta «Verificar presión»." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- El recorrido del tubo con sus alturas: de un levantamiento topográfico o de Google Earth. ¿Cómo? Traza la ruta en Google Earth y anota cada cambio de pendiente: a cuántos metros del inicio está (cadenamiento) y su elevación (cota). Hay una plantilla de Excel descargable para capturarlo.\n- El caudal: llega AUTOMÁTICAMENTE del Cálculo de gasto (paso 1 del Asistente).\n- Material y clase del tubo: si no lo sabes, deja PVC Inglés RD 26 (lo más común en México) — la app te AVISA si no resiste la presión y te muestra las opciones con un clic.\n- ¿Una palabra no te resulta familiar? Abre el Diccionario (arriba a la derecha)." },
      { title: "Paso a paso", content: "1. Captura el terreno con «+ Agregar cota» o importa el Excel (el último punto define la longitud)\n2. Elige qué diseñas (conducción o red) y verifica el caudal\n3. Define el tubo: material, diámetro y clase — si no sabes el diámetro, aplica el recomendado en verde\n4. La app calcula AUTOMÁTICAMENTE la presión de entrada requerida (P1) para que todo cumpla\n5. Revisa el semáforo de la tabla: rojo = no funciona ahí, amarillo = presión baja, verde = cumple" },
      { title: "Interpretación", content: "Verde (OK): la presión cumple el mínimo\nAmarillo (Baja): presión menor al mínimo, pero positiva\nRojo (Crítica): presión negativa — la línea no funciona ahí\nRojo con aviso PN: la presión supera lo que resiste la clase de tubería elegida — la app te muestra las opciones para resolverlo (subir de clase, cambiar de material o colocar una reductora de presión) y las aplicas con un clic\nLa línea piezométrica nunca debe cruzar el perfil del terreno" },
    ],
  },
  "/vrp": {
    title: "Válvula reductora de presión — Guía de uso",
    sections: [
      { title: "¿Qué es y cuándo usar?", content: "La válvula reductora (VRP) funciona como un regulador: recibe mucha presión y entrega una presión fija menor. Se usa cuando el desnivel genera más presión de la que soporta la tubería o la zona (la Línea de conducción te AVISA cuando la necesitas). Este módulo elige el TAMAÑO correcto de la válvula." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- Caudal máximo (Q): llega AUTOMÁTICAMENTE del proyecto (el caudal del Cálculo de gasto). Puedes capturarlo en L/s o en m3/h\n- Presión aguas arriba (P1): llega AUTOMÁTICAMENTE del proyecto (la presión máxima que calculó la Línea de conducción). En una línea existente se mide con manómetro antes de la válvula\n- Presión objetivo (P2): la que TÚ quieres dejar aguas abajo de la válvula — en colonias lo usual es de 2 a 4 kg/cm2\n- Diámetro nominal de la línea (DN): llega automáticamente del proyecto\n- Caudal mínimo (Qmin), opcional: está en «Mostrar parámetros avanzados». Déjalo vacío y la app supone el 10% del caudal máximo" },
      { title: "Paso a paso", content: "1. Entra desde el Asistente: caudal, presión y diámetro ya vienen llenos — si falta algún dato, un aviso te indica cuál capturar\n2. Captura la Presión objetivo (P2) que deseas dejar aguas abajo\n3. Los resultados aparecen automáticamente: la válvula RECOMENDADA se muestra en la tarjeta verde y lleva la etiqueta REC en la tabla de selección\n4. Si aparece alguna advertencia (cavitación, dos válvulas en serie, velocidad alta), la app te indica qué hacer\n5. Con el botón «Descargar PDF» obtienes la memoria de cálculo del módulo" },
      { title: "Interpretación", content: "Los % son capacidad Kv utilizada (no carrera de la válvula)\nÓptimo: usa 35-65% de su capacidad a Q max — operación estable\nFuncional: 20-35% o 65-75% — aceptable\nSobredimensionada: <20% — regulación inestable, considerar un DN menor\nLímite: >75% — válvula demasiado pequeña\nInsuficiente: el Kv de la válvula no alcanza\nÍndice de cavitación sigma < 1.5 (presiones absolutas, aguas abajo): verificar la carta del fabricante\nRelación P1/P2 > 3:1: considerar dos VRP en serie" },
    ],
  },
  "/demanda": {
    title: "Cálculo de gasto — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Es el PASO 1 de todo proyecto: convierte el tamaño del proyecto (habitantes, viviendas o superficie) en el caudal de diseño — cuánta agua hay que llevar. Sin este dato, ningún otro módulo puede dimensionar nada." },
      { title: "Datos que necesitas", content: "- Alguno de estos tres datos, el que tengas disponible: número de habitantes, número de viviendas o superficie en hectáreas (la plataforma hace la conversión por ti)\n- Tipo de desarrollo y clima de la zona (con ellos se sugiere la dotación)\n- Horario de bombeo del pozo: cuántas horas al día bombea y a qué hora arranca (si no lo conoces, déjalo en 24 horas)\n- Si el proyecto es a futuro: la tasa de crecimiento anual y los años del periodo de diseño" },
      { title: "Paso a paso", content: "1. Elige cómo defines el tamaño del proyecto: Habitantes, Viviendas o Superficie, y captura el dato que tengas (si eliges viviendas, la plataforma las convierte a habitantes; si eliges superficie, usa la densidad de la zona)\n2. Selecciona el tipo de desarrollo y el clima; revisa la dotación sugerida en L/hab/día (si tienes dudas, déjala como está)\n3. Captura el horario de bombeo del pozo; el coeficiente de regulación y el volumen del tanque se calculan automáticamente\n4. Si diseñas a futuro, abre «Mostrar parámetros avanzados», activa «Proyectar crecimiento a futuro» e indica la tasa anual y los años del periodo de diseño\n5. Lee tus tres caudales: el Gasto máximo diario (QMD) se usa para la conducción, la bomba y el tanque; el Gasto máximo horario (QMH), para la red de distribución. Avanzan solos al resto del proyecto" },
      { title: "¿Qué caudal se usa para qué? (y por qué)", content: "El consumo de agua no es constante: hay días en los que se consume más (calor, visitas, temporadas) y horas de mayor demanda (por la mañana, cuando todos se preparan para salir). Por eso el cálculo entrega tres caudales:\n\nGasto medio diario (Qmed): el promedio de todos los días del año. Es la referencia base, pero no se diseña con él, porque en los días de mayor consumo resultaría insuficiente.\n\nGasto máximo diario (QMD): el consumo del día de mayor demanda del año. Con este caudal se diseñan la conducción, la bomba y el tanque. ¿Por qué no con la hora de mayor demanda? Porque el tanque almacena: la tubería lo llena de manera constante a lo largo del día y el tanque entrega el agua acumulada en las horas de mayor consumo. A la conducción le corresponde únicamente transportar el volumen total de ese día.\n\nGasto máximo horario (QMH): la hora de mayor consumo del día de mayor consumo. Con este caudal se diseña la red de distribución (las tuberías de las calles), porque la red no cuenta con un tanque que la respalde: debe satisfacer el momento de mayor demanda.\n\nEn resumen, qué se diseña con cada uno:\n· Con el QMD se diseñan la conducción (la tubería que trae el agua desde la fuente), la bomba y el tanque.\n· Con el QMH se diseñan las tuberías de la red que reparten el agua en las calles.\n· El Qmed sirve como referencia de consumos y costos promedio; no se dimensiona con él.\n\nEstos caudales se comparten automáticamente con los demás módulos del proyecto." },
    ],
  },
  "/impulsion": {
    title: "Diámetro económico — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Solo en líneas de BOMBEO: encuentra el diámetro donde la suma de tubería + recibo de luz cuesta menos. Tubo pequeño = bombeo costoso de por vida; tubo grande = inversión inicial alta." },
      { title: "Paso a paso", content: "1. Verifica el Gasto de diseño a bombear (QMD): llega automáticamente desde tu proyecto\n2. Elige el régimen de bombeo (horas de bombeo al día): a menos horas, más caudal de bombeo y tubo más grande\n3. Revisa las cotas de la bomba y del tanque, y la presión requerida en la entrega (déjala en 0 si solo llenas un tanque)\n4. Captura la longitud de la tubería (L) y elige el material\n5. Deja activada la casilla «Calcular el diámetro recomendado automáticamente» para que la plataforma proponga el diámetro económico (fórmula de Bresse); desmárcala si prefieres elegir el diámetro tú mismo y compararlo con el recomendado\n6. Lee el diámetro económico y, con el botón «Aplicar a la Línea de conducción», pásalo a tus tramos con un clic" },
      { title: "Interpretación", content: "Para el diámetro elegido verás la velocidad del agua, las pérdidas por fricción y por accesorios, la carga dinámica total, la potencia y el costo de energía\nSi eliges manualmente un diámetro menor al económico, aparece una advertencia de mayor costo de energía\nLa potencia y el costo mensual/anual son preliminares y sirven para comparar diámetros; la potencia para cotizar la bomba se calcula en el paso «Equipo de bombeo»\nSi la gravedad alcanza para entregar el caudal, el módulo avisa que no se requiere bombeo y conviene revisar la línea por gravedad en «Línea de conducción»" },
    ],
  },
  "/despiece": {
    title: "Generador de cruceros — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para armar los nudos de piezas (cruceros) de la red: cruces, derivaciones y válvulas, y obtener la lista de materiales con SKU Sigma Flow lista para cotizar." },
      { title: "Paso a paso", content: "1. El primer crucero llega con el diámetro y el material del proyecto activo; en cada crucero puedes cambiarlos con los selectores de su cabecera\n2. Ármalo en el modo «Visual» —toca ⊕ en cada brida libre para conectar la siguiente pieza (codo, tee, válvula...)— o cambia al modo «Botones» si prefieres elegir las piezas de una lista\n3. Si el mismo crucero aparece varias veces en la red, indícalo con el contador «Se repite ×» en vez de armarlo otra vez\n4. Pulsa «✓ Listo» para encoger el crucero terminado y «+ Nuevo crucero» para agregar los demás nudos\n5. La lista de materiales consolidada se arma sola abajo —suma todos los cruceros con sus repeticiones e incluye el acoplamiento— y pasa automáticamente al reporte" },
      { title: "Interpretación", content: "Cada pieza lleva su SKU del catálogo Sigma Flow; el botón «Copiar SKUs» copia la lista consolidada para pegarla donde la necesites\nEl consolidado agrupa las piezas de todos los cruceros, ya multiplicadas por sus repeticiones — úsalo directamente para cotizar con tu distribuidor\nEn el modo visual el módulo recomienda la caja de operación del crucero: el marco con tapa se suma solo a la lista y los contramarcos los capturas tú con su medida\nLa tabla de pérdidas por accesorios suma la longitud equivalente (ΣLe) de todos los cruceros; captura el gradiente hidráulico J de la Línea de conducción para convertirla en metros de pérdida" },
    ],
  },
  "/entregable": {
    title: "Reporte de proyecto — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "El paso FINAL: genera el PDF consolidado con todo lo capturado en el proyecto (demanda, línea, bombeo, protecciones, válvulas y despiece)." },
      { title: "Paso a paso", content: "1. Revisa la portada: nombre del proyecto, localidad, fecha y quién elabora — el folio se genera automáticamente y solo se edita si el proyecto ya tiene uno propio\n2. Los datos de las tres hojas (demanda de agua, dimensionamiento de tubería y equipo de bombeo) ya vienen llenos desde los otros pasos — completa manualmente lo que falte\n3. En la hoja 2 puedes agregar el perfil topográfico con «+ Agregar cota» y las válvulas o accesorios por ubicación con «+ Válvula»\n4. Si la línea es por bombeo, marca la casilla «Incluir hoja de bombeo» en la hoja 3\n5. Pulsa «Generar PDF»\n6. Revisa el documento antes de entregarlo" },
      { title: "Interpretación", content: "El reporte es un PREdimensionamiento: sirve para cotizar e iniciar el proyecto\nNo sustituye al proyecto ejecutivo firmado por un responsable técnico" },
    ],
  },
};

export function HidroCalcHeader() {
  const pathname = usePathname();
  const moduleName = Object.entries(moduleNames).find(([path]) => pathname.startsWith(path))?.[1] || "";
  const help = Object.entries(moduleHelp).find(([path]) => pathname.startsWith(path))?.[1];

  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-gray-200/80 shadow-[0_1px_3px_rgba(15,36,56,0.05)]" style={{ height: 56 }}>
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-[11px] font-bold text-[#1C3D5A]/45 hover:text-[#1C3D5A] transition-colors tracking-[0.14em] uppercase">
            Sigma Flow
          </Link>
          {moduleName && (
            <>
              <span className="text-gray-300 text-xs">›</span>
              <h1 className="text-[15px] font-bold text-[#0F2438] dark:text-white tracking-tight">{moduleName}</h1>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {help && <HelpButton moduleTitle={help.title} sections={help.sections} />}
          <GlossaryButton variant="header" />
          <Link href="/cuenta" className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1C3D5A] border border-[#1C3D5A]/25 rounded-full px-3 py-1 hover:bg-[#1C3D5A] hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
            Cuenta
          </Link>
          <span className="text-[9px] text-gray-400 tracking-[0.12em] uppercase font-semibold hidden sm:inline-block border border-gray-200 rounded-full px-2.5 py-1 bg-gray-50/60">Uso técnico</span>
        </div>
      </div>
    </header>
  );
}
