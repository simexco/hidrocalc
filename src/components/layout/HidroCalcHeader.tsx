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
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- Caudal Q: cuánta agua va a pasar, en litros por segundo. Si ya hiciste el Cálculo de gasto, es ese QMD (se carga automáticamente si vienes del Asistente).\n- Diámetro DN: el tamaño del tubo. Viene impreso en el propio tubo o en la factura de compra.\n- Longitud L: los metros de tubo de inicio a fin. Si no la tienes, traza la ruta en Google Earth y copia la distancia.\n- Presión de entrada P1: con cuánta presión inicia el tramo. Si sale de un tanque elevado: desnivel en metros ÷ 10 (un tanque 30 m arriba da 3 kg/cm2). Si la línea ya existe, se mide con un manómetro.\n- ¿Te falta alguno? La app usa un valor típico y lo marca como «supuesto»: puedes calcular con datos parciales." },
      { title: "Los 3 modos (elige tu pregunta)", content: "A) ¿La presión llega al final? — captura Q, el tubo y P1\nB) ¿Cuánta agua puede pasar sin bajar de presión? — captura el tubo, P1 y la presión mínima\nC) ¿Qué diámetro necesito? — captura Q y la presión disponible" },
      { title: "¿Cómo leo el resultado?", content: "Presión final P2: debe ser de al menos 1.0 kg/cm2 (lo que exige CONAGUA)\nVelocidad: adecuada entre 0.3 y 2.5 m/s — si queda fuera de ese rango, la app te avisa y sugiere otro diámetro\nSi algo aparece en rojo, la app indica QUÉ cambiar. Los términos poco comunes están en el Diccionario (arriba a la derecha)." },
    ],
  },
  "/golpe-ariete": {
    title: "Golpe de ariete — Guía de uso",
    sections: [
      { title: "¿Qué es y cuándo usar?", content: "Cuando el agua se detiene de golpe (se cierra una válvula o se apaga la bomba), la tubería recibe una sacudida de presión adicional. Este módulo revisa si tu tubería la resiste. Úsalo SIEMPRE que la línea sea de bombeo; en gravedad, cuando haya válvulas que cierren rápido." },
      { title: "Buena noticia: casi todo se llena automáticamente", content: "Si ya capturaste la Línea de conducción (paso 2 del Asistente), la tubería, el caudal, la presión y la longitud llegan AUTOMÁTICAMENTE a este módulo. Si cambiaste algo después, pulsa el botón «Traer datos del proyecto» y se vuelven a cargar. No tienes que ir a buscar nada a otro módulo." },
      { title: "El único dato nuevo: tiempo de cierre (Tc)", content: "Es el número de segundos que tarda la válvula en cerrarse. ¿De dónde lo obtengo?\n- De la ficha técnica de la válvula (solicítala al proveedor)\n- ¿No lo tienes? Deja el valor por defecto: la app supone el caso MÁS desfavorable (cierre rápido), que es lo seguro\n- Regla práctica: cerrar lento suaviza el golpe; por eso las válvulas grandes se cierran despacio" },
      { title: "Paso a paso", content: "1. Entra desde el Asistente: los datos ya vienen llenos\n2. Revisa que la tubería mostrada sea la de tu proyecto (material, tamaño y clase)\n3. Observa el VEREDICTO en grande: ¿resiste o no resiste?\n4. Si NO resiste, la app te indica qué clase sí resiste o qué protección agregar\n5. No necesitas entender las fórmulas — el veredicto es el resultado" },
      { title: "¿Cómo leo el resultado?", content: "RESISTE: la tubería soporta la presión normal + el golpe. Sigue adelante.\nNO RESISTE: sube de clase (pared más gruesa), cambia de material o agrega la protección que la app recomienda.\nPresión negativa: riesgo de que el tubo se aplaste por vacío — se recomiendan válvulas de admisión de aire.\nFactor de seguridad 1.5 = queda un 50% de margen (lo recomendado en agua potable).\n¿Un término no te resulta familiar? Está en el Diccionario (arriba a la derecha)." },
    ],
  },
  "/equipo-bombeo": {
    title: "Equipo de bombeo — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para predimensionar la bomba de un sistema: obtener la Carga Dinámica Total (CDT) y la potencia de referencia (HP) con las que se solicita cotización a un proveedor de bombas." },
      { title: "Los dos casos", content: "CASO 1 — Pozo → Tanque: la bomba está dentro de un pozo y eleva el agua a un tanque. La succión es el NIVEL DINÁMICO del agua (no la profundidad de la bomba).\n\nCASO 2 — Tanque → Red / otro tanque: la bomba toma de un tanque y envía a la red o a otro tanque. Permite varios equipos en paralelo (1, 1+1, 2+1) y elegir el tipo de bomba." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- Cotas de succión y entrega: ubica cada punto en Google Earth y lee la elevación que aparece en la parte inferior (en metros). Es la altura del lugar donde está la bomba y del tanque al que llega el agua.\n- Si es POZO: el nivel dinámico — la profundidad a la que queda el agua MIENTRAS se bombea. Lo indica el aforo del pozo (reporte del perforador); no es la profundidad de la bomba.\n- Caudal, tubo y longitud: llegan AUTOMÁTICAMENTE del proyecto si ya hiciste los pasos 1 y 2 del Asistente.\n- Presión de servicio: 0 si solo llenas un tanque; 1.5-2.0 kg/cm2 si entregas directamente a una red." },
      { title: "Paso a paso", content: "1. Elegir el caso (pozo → tanque, o tanque → red)\n2. Capturar las cotas (ver arriba de dónde obtenerlas)\n3. Verificar Q, diámetro, material y longitud — ya vienen llenos del proyecto\n4. Indicar la presión de servicio en la entrega\n5. Leer los 4 datos para cotizar: CDT, gasto total, gasto por bomba y HP por bomba" },
      { title: "Interpretación", content: "CDT = carga estática + fricción + pérdidas locales + presión de servicio.\nLa potencia mostrada es el HP comercial inmediato superior (eficiencia 70% por defecto).\nEl par Q + CDT es lo que el proveedor necesita para proponer el modelo definitivo.\nVelocidad recomendada en la línea: 0.3 a 2.5 m/s." },
    ],
  },
  "/bombeo": {
    title: "Punto de operación — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Cuando ya tienes la FICHA TÉCNICA de una bomba y quieres saber a qué caudal y presión va a trabajar realmente en TU línea (no en el laboratorio del fabricante)." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- La curva de la bomba: la tabla o gráfica Q-H que viene en la ficha técnica — solicítala al proveedor de la bomba; es un dato suyo, no tuyo\n- Hg: el desnivel entre el agua de donde se succiona y el punto de entrega (cotas de Google Earth)\n- El tubo (DN, material, longitud): del proyecto o de la factura\n- ¿Todavía no tienes la curva? Usa primero Equipo de bombeo: con Q y CDT el proveedor te propone el modelo, y con su ficha regresas aquí a verificar" },
      { title: "Paso a paso", content: "1. Ingresa la altura geométrica Hg\n2. Ingresa la P2 remanente si aplica (Hs = Hg + P2x10)\n3. Ingresa longitud, DN y material\n4. En «Bomba» selecciona Ecuación o Puntos:\n   - Ecuación: ingresa H0 y K de la ficha técnica\n   - Puntos: ingresa pares Q-H del fabricante\n5. El gráfico muestra la intersección\n6. Verifica la recomendación de bomba" },
    ],
  },
  "/dimensionamiento": {
    title: "Dimensionamiento — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Cuando no sabes qué tamaño de tubo elegir: la app prueba TODOS los diámetros comerciales con tu caudal y marca en verde los que funcionan. Tú solo eliges el más pequeño de los verdes (el más económico que cumple)." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- Caudal Q: el QMD del Cálculo de gasto (llega automáticamente si vienes del Asistente)\n- Longitud L: metros de tubo — mídelos en Google Earth si no los tienes\n- Presión de entrada P1: si no la conoces, déjala vacía; la tabla compara velocidades de todos modos\n- Lo demás tiene valores por defecto que puedes dejar como están" },
      { title: "Paso a paso", content: "1. Verifica el caudal y la longitud\n2. Deja el material como está (PVC), salvo que tu proyecto requiera otro\n3. La tabla aparece automáticamente\n4. Elige el DN más pequeño que aparezca en VERDE (el recomendado se marca con «REC»)\n5. Usa ese diámetro en la Línea de conducción" },
      { title: "Interpretación de la tabla", content: "V min: velocidad >= 0.3 m/s (sin sedimentación)\nV max: velocidad <= 2.5 m/s (sin erosión)\nPres.: P2 calculada >= P2 mínima\nEstado OK: cumple los tres criterios\nREC: DN mínimo que cumple todo" },
    ],
  },
  "/valvulas-aire": {
    title: "Válvulas de Aire — Guía de uso",
    sections: [
      { title: "¿Qué es y cuándo usar?", content: "En toda línea se acumula aire en las partes ALTAS del trazo (como la burbuja en una manguera). Si no se extrae, obstruye el paso del agua; y al vaciar la línea, si no entra aire, el tubo se puede aplastar. Este módulo te indica DÓNDE colocar cada válvula de aire y de qué tamaño." },
      { title: "Buena noticia: los datos llegan automáticamente", content: "El perfil del terreno, el caudal y el tubo llegan AUTOMÁTICAMENTE desde la Línea de conducción (paso 2 del Asistente). Si entras directamente sin proyecto, captura el terreno con «+ Agregar cota» o impórtalo desde Excel, igual que en la Línea de conducción." },
      { title: "Tipos de válvulas (la app los elige por ti)", content: "VA-C (combinada): en los puntos altos importantes — expulsa y admite aire\nVA-A (admisión/expulsión): en bajadas pronunciadas — evita que el tubo se aplaste al vaciarlo\nVA-E (eliminadora): en tramos largos y planos — expulsa el aire que se acumula durante la operación\nNo tienes que decidirlo tú: la app indica cuál va en cada punto y de qué tamaño." },
      { title: "Paso a paso", content: "1. Revisa que el perfil esté completo (que no falte ninguna loma ni barranca del trazo)\n2. Los resultados aparecen automáticamente en la tabla y en el dibujo\n3. Los puntos BAJOS no llevan válvula de aire: la app recomienda ahí un desagüe para drenar\n4. Las válvulas pasan automáticamente al reporte final" },
      { title: "Interpretación", content: "VA-C azul: ubicación crítica — instalación obligatoria\nVA-A amarilla: necesaria para vaciado seguro\nVA-E verde: mantenimiento de aire en operación\nFondo rojo: presión insuficiente — revisar diseño\nLínea piezométrica: nunca debe cruzar el perfil del terreno" },
    ],
  },
  "/perfil": {
    title: "Línea de conducción — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para diseñar o verificar una línea de conducción completa. Cargas el perfil topográfico, defines los tramos de tubería (DN y material) y el módulo calcula la presión en cada punto. También puedes comparar escenarios y calcular la P1 requerida." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- El recorrido del tubo con sus alturas: de un levantamiento topográfico o de Google Earth. ¿Cómo? Traza la ruta en Google Earth y anota cada cambio de pendiente: a cuántos metros del inicio está (cadenamiento) y su elevación (cota). Hay una plantilla de Excel descargable para capturarlo.\n- El caudal: llega AUTOMÁTICAMENTE del Cálculo de gasto (paso 1 del Asistente).\n- Material y clase del tubo: si no lo sabes, deja PVC Inglés RD 26 (lo más común en México) — la app te AVISA si no resiste la presión y te muestra las opciones con un clic.\n- ¿Una palabra no te resulta familiar? Abre el Diccionario (arriba a la derecha)." },
      { title: "Paso a paso", content: "1. Captura el terreno con «+ Agregar cota» o importa el Excel (el último punto define la longitud)\n2. Elige qué diseñas (conducción o red) y verifica el caudal\n3. Define el tubo: material, diámetro y clase — si no sabes el diámetro, aplica el recomendado en verde\n4. La app calcula AUTOMÁTICAMENTE la presión de entrada requerida (P1) para que todo cumpla\n5. Revisa el semáforo de la tabla: rojo = no funciona ahí, amarillo = presión baja, verde = cumple" },
      { title: "Interpretación", content: "Verde (OK): la presión cumple el mínimo\nAmarillo (Baja): presión menor al mínimo, pero positiva\nRojo (Crítica): presión negativa — la línea no funciona ahí\nLa línea piezométrica nunca debe cruzar el perfil del terreno" },
    ],
  },
  "/vrp": {
    title: "Válvula reductora de presión — Guía de uso",
    sections: [
      { title: "¿Qué es y cuándo usar?", content: "La válvula reductora (VRP) funciona como un regulador: recibe mucha presión y entrega una presión fija menor. Se usa cuando el desnivel genera más presión de la que soporta la tubería o la zona (la Línea de conducción te AVISA cuando la necesitas). Este módulo elige el TAMAÑO correcto de la válvula." },
      { title: "Datos que necesitas (y de dónde obtenerlos)", content: "- Caudal máximo: llega AUTOMÁTICAMENTE del proyecto (el QMD/QMH del Cálculo de gasto)\n- Presión de entrada P1: llega AUTOMÁTICAMENTE del proyecto (la presión máxima que calculó la Línea de conducción). En una línea existente se mide con manómetro antes de la válvula\n- Presión de salida P2: la que TÚ quieres dejar aguas abajo — en colonias lo usual es de 2 a 4 kg/cm2\n- DN de la línea: llega automáticamente del proyecto\n- Caudal mínimo (opcional): déjalo vacío y la app supone el 10% del máximo" },
      { title: "Paso a paso", content: "1. Entra desde el Asistente: caudal, presión y diámetro ya vienen llenos\n2. Define la presión de salida P2 que deseas\n3. La tabla aparece automáticamente: la válvula ÓPTIMA viene marcada\n4. Si aparece alguna advertencia (cavitación, dos válvulas en serie), la app te indica qué hacer" },
      { title: "Interpretación", content: "Los % son capacidad Kv utilizada (no carrera de la válvula)\nÓptimo: usa 35-65% de su capacidad a Q max — operación estable\nFuncional: 20-35% o 65-75% — aceptable\nSobredimensionada: <20% — regulación inestable, considerar un DN menor\nLímite: >75% — válvula demasiado pequeña\nInsuficiente: el Kv de la válvula no alcanza\nÍndice de cavitación sigma < 1.5 (presiones absolutas, aguas abajo): verificar la carta del fabricante\nRelación P1/P2 > 3:1: considerar dos VRP en serie" },
    ],
  },
  "/demanda": {
    title: "Cálculo de gasto — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Es el PASO 1 de todo proyecto: convierte la población en el caudal de diseño (cuánta agua hay que llevar). Sin este dato, ningún otro módulo puede dimensionar nada." },
      { title: "Datos que necesitas", content: "- Población a servir (si solo conoces el número de viviendas, multiplícalo por ~4 habitantes)\n- Tipo de localidad y clima (definen la dotación sugerida)\n- Si el proyecto es a futuro: los años del periodo de diseño" },
      { title: "Paso a paso", content: "1. Captura la población\n2. Revisa la dotación sugerida en L/hab/día (si tienes dudas, déjala como está)\n3. Si diseñas a futuro, activa el crecimiento e indica los años\n4. Lee tus tres caudales: el Gasto máximo diario (QMD) es el que usarás para la tubería y la bomba; el Gasto máximo horario (QMH), para la red de las calles\n5. El volumen del tanque se calcula automáticamente con el horario de bombeo del pozo" },
      { title: "¿Qué caudal se usa para qué? (y por qué)", content: "El consumo de agua no es constante: hay días en los que se consume más (calor, visitas, temporadas) y horas de mayor demanda (por la mañana, cuando todos se preparan para salir). Por eso el cálculo entrega tres caudales:\n\nGasto medio diario (Qmed): el promedio de todos los días del año. Es la referencia base, pero no se diseña con él, porque en los días de mayor consumo resultaría insuficiente.\n\nGasto máximo diario (QMD): el consumo del día de mayor demanda del año. Con este caudal se diseñan la conducción, la bomba y el tanque. ¿Por qué no con la hora de mayor demanda? Porque el tanque almacena: la tubería lo llena de manera constante a lo largo del día y el tanque entrega el agua acumulada en las horas de mayor consumo. A la conducción le corresponde únicamente transportar el volumen total de ese día.\n\nGasto máximo horario (QMH): la hora de mayor consumo del día de mayor consumo. Con este caudal se diseña la red de distribución (las tuberías de las calles), porque la red no cuenta con un tanque que la respalde: debe satisfacer el momento de mayor demanda.\n\nEn resumen, qué se diseña con cada uno:\n· Con el QMD se diseñan la conducción (la tubería que trae el agua desde la fuente), la bomba y el tanque.\n· Con el QMH se diseñan las tuberías de la red que reparten el agua en las calles.\n· El Qmed sirve como referencia de consumos y costos promedio; no se dimensiona con él.\n\nEstos caudales se comparten automáticamente con los demás módulos del proyecto." },
    ],
  },
  "/impulsion": {
    title: "Diámetro económico — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Solo en líneas de BOMBEO: encuentra el diámetro donde la suma de tubería + recibo de luz cuesta menos. Tubo pequeño = bombeo costoso de por vida; tubo grande = inversión inicial alta." },
      { title: "Paso a paso", content: "1. Verifica el caudal (llega automáticamente del proyecto)\n2. Elige las horas de bombeo al día\n3. Captura la longitud y las cotas de la bomba y el tanque\n4. Lee el DN económico (fórmula de Bresse)\n5. Con un clic lo aplicas a la Línea de conducción" },
      { title: "Interpretación", content: "El módulo compara velocidad, pérdidas y costo de energía de cada DN\nSi eliges un DN menor al económico, verás el sobrecosto de energía\nLa potencia y el costo mensual/anual son de referencia para decidir" },
    ],
  },
  "/despiece": {
    title: "Generador de cruceros — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para armar los nudos de piezas (cruceros) de la red: cruces, derivaciones y válvulas, y obtener la lista de materiales con SKU Sigma Flow lista para cotizar." },
      { title: "Paso a paso", content: "1. El DN y el material llegan automáticamente del proyecto\n2. Arma el crucero con los botones visuales: codo, tee, válvula, brida...\n3. Agrega tantos cruceros como nudos tenga tu red\n4. La lista de materiales se consolida automáticamente (suma las piezas repetidas)\n5. El despiece pasa automáticamente al reporte" },
      { title: "Interpretación", content: "Cada pieza lleva su SKU del catálogo Sigma Flow\nEl consolidado agrupa las piezas de todos los cruceros\nÚsalo directamente para cotizar con tu distribuidor" },
    ],
  },
  "/entregable": {
    title: "Reporte de proyecto — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "El paso FINAL: genera el PDF consolidado con todo lo capturado en el proyecto (demanda, línea, bombeo, protecciones, válvulas y despiece)." },
      { title: "Paso a paso", content: "1. Revisa la portada: nombre del proyecto, localidad, folio y quién elabora\n2. Los datos ya vienen llenos desde los otros pasos — completa manualmente lo que falte\n3. Pulsa Generar PDF\n4. Revisa el documento antes de entregarlo" },
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
