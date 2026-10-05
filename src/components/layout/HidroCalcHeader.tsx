"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { HelpButton } from "@/components/ui/HelpModal";
import { GlossaryButton } from "@/components/ui/GlossaryModal";

const moduleNames: Record<string, string> = {
  "/asistente": "Asistente de proyecto",
  "/demanda": "Calculo de gasto",
  "/tramo-simple": "Verificar presión",
  "/perfil": "Linea de conduccion",
  "/impulsion": "Calculo de diametro economico",
  "/equipo-bombeo": "Equipo de bombeo",
  "/golpe-ariete": "Golpe de ariete",
  "/dimensionamiento": "Elegir diámetro",
  "/conversor": "Conversor de unidades",
  "/despiece": "Generador de cruceros",
  "/valvulas-aire": "Válvulas de aire",
  "/vrp": "Valvula reductora",
  "/entregable": "Reporte de proyecto",
  "/proyectos": "Mis proyectos",
  "/cuenta": "Mi cuenta",
};

const moduleHelp: Record<string, { title: string; sections: { title: string; content: string }[] }> = {
  "/tramo-simple": {
    title: "Verificar presion — Guia de uso",
    sections: [
      { title: "¿Cuando usar?", content: "Para revisar UN tramo de tubo sencillo (mismo diametro y material de punta a punta): ¿llega la presion al final? ¿cuanta agua puede pasar? Si tu linea cambia de diametro o cruza lomas y barrancas, mejor usa Linea de conduccion." },
      { title: "Datos que necesitas (y de donde sacarlos)", content: "- Caudal Q: cuanta agua va a pasar, en litros por segundo. Si ya hiciste el Calculo de gasto, es ese QMD (llega solo si vienes del Asistente).\n- Diametro DN: el tamaño del tubo. Viene impreso en el propio tubo o en la factura de compra.\n- Longitud L: los metros de tubo de inicio a fin. Si no la tienes, traza la ruta en Google Earth y copia la distancia.\n- Presion de entrada P1: con cuanta presion arranca el tramo. Si sale de un tanque elevado: desnivel en metros ÷ 10 (un tanque 30 m arriba da 3 kg/cm2). Si la linea ya existe: se mide con un manometro.\n- ¿No tienes alguno? La app usa un valor tipico y te lo marca como \"supuesto\" — puedes calcular con datos parciales." },
      { title: "Los 3 modos (elige tu pregunta)", content: "A) ¿La presion llega al final? — dame Q, tubo y P1\nB) ¿Cuanta agua puede pasar sin bajar de presion? — dame tubo, P1 y la presion minima\nC) ¿Que diametro necesito? — dame Q y la presion disponible" },
      { title: "¿Como leo el resultado?", content: "Presion final P2: debe ser al menos 1.0 kg/cm2 (lo que pide CONAGUA)\nVelocidad: sana entre 0.3 y 2.5 m/s — si sale de ese rango, la app te avisa y sugiere otro diametro\nSi algo sale en rojo, la app dice QUE cambiar. Las palabras raras estan en el Diccionario (arriba a la derecha)." },
    ],
  },
  "/golpe-ariete": {
    title: "Golpe de ariete — Guia de uso",
    sections: [
      { title: "¿Que es y cuando usar?", content: "Cuando el agua se detiene de golpe (se cierra una valvula o se para la bomba), el tubo recibe un \"manotazo\" de presion extra. Este modulo revisa si tu tuberia lo aguanta. Usalo SIEMPRE que la linea sea de bombeo; en gravedad, cuando haya valvulas que cierren rapido." },
      { title: "Buena noticia: casi todo se llena solo", content: "Si ya capturaste la Linea de conduccion (paso 2 del Asistente), la tuberia, el caudal, la presion y la longitud llegan SOLOS a este modulo. Si cambiaste algo despues, pulsa el boton \"Traer datos del proyecto\" y se vuelven a cargar. No tienes que ir a buscar nada a otro modulo." },
      { title: "El unico dato nuevo: tiempo de cierre (Tc)", content: "Es cuantos segundos tarda la valvula en cerrarse. ¿De donde lo saco?\n- De la ficha tecnica de la valvula (pideselo al proveedor)\n- ¿No lo tienes? Deja el valor por defecto: la app supone el caso MAS desfavorable (cierre rapido), que es lo seguro\n- Regla practica: cerrar lento suaviza el golpe; por eso las valvulas grandes se cierran despacio" },
      { title: "Paso a paso", content: "1. Entra desde el Asistente: los datos ya vienen llenos\n2. Revisa que la tuberia mostrada sea la de tu proyecto (material, tamaño y clase)\n3. Mira el VEREDICTO en grande: ¿resiste o no resiste?\n4. Si NO resiste: la app te dice que clase si aguanta o que proteccion agregar\n5. No necesitas entender las formulas — el veredicto es el resultado" },
      { title: "¿Como leo el resultado?", content: "RESISTE: la tuberia aguanta la presion normal + el golpe. Sigue adelante.\nNO RESISTE: sube de clase (pared mas gruesa), cambia de material o agrega la proteccion que la app recomienda.\nPresion negativa: riesgo de que el tubo se aplaste por vacio — se recomiendan valvulas de admision de aire.\nFactor de seguridad 1.5 = queda 50% de margen (lo recomendado en agua potable).\n¿Un termino no te suena? Esta en el Diccionario (arriba a la derecha)." },
    ],
  },
  "/equipo-bombeo": {
    title: "Equipo de bombeo — Guia de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para predimensionar la bomba de un sistema: obtener la Carga Dinámica Total (CDT) y la potencia de referencia (HP) con las que se solicita cotización a un proveedor de bombas." },
      { title: "Los dos casos", content: "CASO 1 — Pozo → Tanque: la bomba está dentro de un pozo y eleva el agua a un tanque. La succión es el NIVEL DINÁMICO del agua (no la profundidad de la bomba).\n\nCASO 2 — Tanque → Red / otro tanque: la bomba toma de un tanque y envía a la red o a otro tanque. Permite varios equipos en paralelo (1, 1+1, 2+1) y elegir el tipo de bomba." },
      { title: "Datos que necesitas (y de donde sacarlos)", content: "- Cotas de succion y entrega: parate en cada punto en Google Earth y lee la elevacion que marca abajo (en metros). Es la altura del lugar donde esta la bomba y del tanque al que llega.\n- Si es POZO: el nivel dinamico — a que profundidad queda el agua MIENTRAS se bombea. Lo da el aforo del pozo (reporte del perforador); no es la profundidad de la bomba.\n- Caudal, tubo y longitud: llegan SOLOS del proyecto si ya hiciste los pasos 1 y 2 del Asistente.\n- Presion de servicio: 0 si solo llenas un tanque; 1.5-2.0 kg/cm2 si entregas directo a una red." },
      { title: "Paso a paso", content: "1. Elegir el caso (pozo → tanque, o tanque → red)\n2. Capturar las cotas (ver arriba de donde sacarlas)\n3. Verificar Q, diametro, material y longitud — ya vienen llenos del proyecto\n4. Indicar la presion de servicio en la entrega\n5. Leer los 4 datos para cotizar: CDT, gasto total, gasto por bomba y HP por bomba" },
      { title: "Interpretación", content: "CDT = carga estática + fricción + pérdidas locales + presión de servicio.\nLa potencia mostrada es el HP comercial inmediato superior (eficiencia 70% por defecto).\nEl par Q + CDT es lo que el proveedor necesita para proponer el modelo definitivo.\nVelocidad recomendada en la línea: 0.3 a 2.5 m/s." },
    ],
  },
  "/bombeo": {
    title: "Punto de Operacion — Guia de uso",
    sections: [
      { title: "¿Cuando usar?", content: "Cuando ya tienes en la mano la FICHA TECNICA de una bomba y quieres saber a que caudal y presion va a trabajar realmente en TU linea (no en el laboratorio del fabricante)." },
      { title: "Datos que necesitas (y de donde sacarlos)", content: "- La curva de la bomba: la tabla o grafica Q-H que viene en la ficha tecnica — pidesela al proveedor de la bomba, es un dato suyo, no tuyo\n- Hg: el desnivel entre el agua de donde succiona y el punto de entrega (cotas de Google Earth)\n- El tubo (DN, material, longitud): del proyecto o de la factura\n- ¿No tienes la curva todavia? Usa primero Equipo de bombeo: con Q y CDT el proveedor te propone el modelo, y ya con su ficha regresas aqui a verificar" },
      { title: "Paso a paso", content: "1. Ingresa altura geométrica Hg\n2. Ingresa P2 remanente si aplica (Hs = Hg + P2x10)\n3. Ingresa longitud, DN y material\n4. En 'Bomba' selecciona Ecuacion o Puntos:\n   - Ecuacion: ingresa H0 y K de la ficha tecnica\n   - Puntos: ingresa pares Q-H del fabricante\n5. El grafico muestra la interseccion\n6. Verifica la recomendacion de bomba" },
    ],
  },
  "/dimensionamiento": {
    title: "Dimensionamiento — Guia de uso",
    sections: [
      { title: "¿Cuando usar?", content: "Cuando no sabes que tamaño de tubo poner: la app prueba TODOS los diametros comerciales con tu caudal y te pinta en verde los que funcionan. Tu solo eliges el mas chico de los verdes (el mas barato que cumple)." },
      { title: "Datos que necesitas (y de donde sacarlos)", content: "- Caudal Q: el QMD del Calculo de gasto (llega solo si vienes del Asistente)\n- Longitud L: metros de tubo — midelos en Google Earth si no los tienes\n- Presion de entrada P1: si no la conoces, dejala vacia; la tabla igual compara velocidades\n- Lo demas tiene valores por defecto que puedes dejar como estan" },
      { title: "Paso a paso", content: "1. Verifica el caudal y la longitud\n2. Deja el material como esta (PVC) salvo que tu proyecto pida otro\n3. La tabla aparece sola\n4. Elige el DN mas chico que salga en VERDE (dice \"REC\" el recomendado)\n5. Ese diametro usalo en la Linea de conduccion" },
      { title: "Interpretación de la tabla", content: "V min: velocidad >= 0.3 m/s (sin sedimentación)\nV max: velocidad <= 2.5 m/s (sin erosión)\nPres.: P2 calculada >= P2 minima\nEstado OK: cumple los tres criterios\nREC: DN minimo que cumple todo" },
    ],
  },
  "/valvulas-aire": {
    title: "Válvulas de Aire — Guía de uso",
    sections: [
      { title: "¿Que es y cuando usar?", content: "En toda linea se junta aire en las partes ALTAS del trazo (como la burbuja en una manguera). Si no se saca, tapa el paso del agua; y al vaciar la linea, si no entra aire, el tubo se puede aplastar. Este modulo te dice DONDE poner cada valvula de aire y de que tamaño." },
      { title: "Buena noticia: los datos llegan solos", content: "El perfil del terreno, el caudal y el tubo llegan SOLOS desde la Linea de conduccion (paso 2 del Asistente). Si entras directo sin proyecto: captura el terreno con \"+ Agregar cota\" o importalo de Excel, igual que en la Linea de conduccion." },
      { title: "Tipos de valvulas (la app los elige por ti)", content: "VA-C (combinada): en los puntos altos importantes — saca y mete aire\nVA-A (admision/expulsion): en bajadas pronunciadas — evita que el tubo se aplaste al vaciarlo\nVA-E (eliminadora): en tramos largos planos — saca el aire que se acumula operando\nNo tienes que decidirlo tu: la app marca cual va en cada punto y su tamaño." },
      { title: "Paso a paso", content: "1. Revisa que el perfil este completo (que no falte ninguna loma ni barranca del trazo)\n2. Los resultados aparecen solos en la tabla y el dibujo\n3. Los puntos BAJOS no llevan valvula de aire: la app recomienda ahi un desague para drenar\n4. Las valvulas pasan solas al reporte final" },
      { title: "Interpretación", content: "VA-C azul: ubicación crítica — instalación obligatoria\nVA-A amarilla: necesaria para vaciado seguro\nVA-E verde: mantenimiento de aire en operación\nFondo rojo: presión insuficiente — revisar diseño\nLínea piezométrica: nunca debe cruzar el perfil del terreno" },
    ],
  },
  "/perfil": {
    title: "Linea de Conduccion — Guia de uso",
    sections: [
      { title: "Cuando usar?", content: "Para diseñar o verificar una línea de conducción completa. Cargas el perfil topografico, defines los tramos de tuberia (DN y material) y el modulo calcula la presion en cada punto. Tambien puedes comparar escenarios y calcular la P1 requerida." },
      { title: "Datos que necesitas (y de donde sacarlos)", content: "- El recorrido del tubo con sus alturas: de un levantamiento topografico o de Google Earth. ¿Como? Traza la ruta en Google Earth y anota cada cambio de pendiente: a cuantos metros del inicio esta (cadenamiento) y su elevacion (cota). Hay plantilla de Excel descargable para vaciarlo.\n- El caudal: llega SOLO del Calculo de gasto (paso 1 del Asistente).\n- Material y clase del tubo: si no sabes, deja PVC Ingles RD 26 (lo mas comun en Mexico) — la app te AVISA si no aguanta la presion y te da las opciones con un clic.\n- ¿Una palabra no te suena? Abre el Diccionario (arriba a la derecha)." },
      { title: "Paso a paso", content: "1. Captura el terreno con \"+ Agregar cota\" o importa el Excel (el ultimo punto define la longitud)\n2. Elige que diseñas (conduccion o red) y verifica el caudal\n3. Define el tubo: material, diametro y clase — si no sabes el diametro, aplica el recomendado en verde\n4. La app calcula SOLA la presion de entrada requerida (P1) para que todo cumpla\n5. Revisa el semaforo de la tabla: rojo = no funciona ahi, amarillo = presion baja, verde = cumple" },
      { title: "Interpretacion", content: "Verde (OK): presion cumple el minimo\nAmarillo (Baja): presion menor al minimo pero positiva\nRojo (Critica): presion negativa — la linea no funciona ahi\nLa linea piezometrica nunca debe cruzar el perfil del terreno" },
    ],
  },
  "/vrp": {
    title: "Valvula Reductora de Presion — Guia de uso",
    sections: [
      { title: "¿Que es y cuando usar?", content: "La valvula reductora (VRP) \"baja el switch\" de la presion: recibe mucha presion y entrega una presion fija menor. Se usa cuando el desnivel mete mas presion de la que aguanta la tuberia o la zona (la Linea de conduccion te AVISA cuando la necesitas). Este modulo elige el TAMAÑO correcto de la valvula." },
      { title: "Datos que necesitas (y de donde sacarlos)", content: "- Caudal maximo: llega SOLO del proyecto (el QMD/QMH del Calculo de gasto)\n- Presion de entrada P1: llega SOLA del proyecto (la presion maxima que calculo la Linea de conduccion). En linea existente: se mide con manometro antes de la valvula\n- Presion de salida P2: la que TU quieres dejar aguas abajo — en colonias lo usual es 2 a 4 kg/cm2\n- DN de la linea: llega solo del proyecto\n- Caudal minimo (opcional): dejalo vacio y la app supone el 10% del maximo" },
      { title: "Paso a paso", content: "1. Entra desde el Asistente: caudal, presion y diametro ya vienen llenos\n2. Define la presion de salida P2 que quieres\n3. La tabla aparece sola: la valvula OPTIMA viene marcada\n4. Si sale alguna advertencia (cavitacion, dos valvulas en serie), la app te dice que hacer" },
      { title: "Interpretacion", content: "Los % son capacidad Kv utilizada (no carrera de la valvula)\nOptimo: usa 35-65% de su capacidad a Q max — operacion estable\nFuncional: 20-35% o 65-75% — aceptable\nSobredimensionada: <20% — regulacion inestable, considerar DN menor\nLimite: >75% — valvula demasiado chica\nInsuficiente: el Kv de la valvula no alcanza\nIndice de cavitacion sigma < 1.5 (presiones absolutas, aguas abajo): verificar carta del fabricante\nRelacion P1/P2 > 3:1: considerar dos VRP en serie" },
    ],
  },
  "/demanda": {
    title: "Calculo de gasto — Guia de uso",
    sections: [
      { title: "¿Cuando usar?", content: "Es el PASO 1 de todo proyecto: convierte la poblacion en el caudal de diseño (cuanta agua hay que llevar). Sin este dato ningun otro modulo puede dimensionar nada." },
      { title: "Datos que necesitas", content: "- Poblacion a servir (si solo tienes viviendas: multiplica por ~4 habitantes)\n- Tipo de localidad y clima (definen la dotacion sugerida)\n- Si el proyecto es a futuro: años del periodo de diseño" },
      { title: "Paso a paso", content: "1. Captura la poblacion\n2. Revisa la dotacion sugerida en L/hab/dia (si dudas, dejala como esta)\n3. Si diseñas a futuro, activa el crecimiento y pon los años\n4. Lee el QMD (para conduccion y bombeo) y el QMH (para red)\n5. El volumen de tanque sale solo con el coeficiente de regulacion" },
      { title: "Interpretacion", content: "Qm = el promedio del dia\nQMD = el dia de mayor consumo del año → con este se diseña la conduccion y el bombeo\nQMH = la hora pico de ese dia → con este se diseña la red de distribucion\nEstos caudales viajan solos a los demas modulos del proyecto" },
    ],
  },
  "/impulsion": {
    title: "Diametro economico — Guia de uso",
    sections: [
      { title: "¿Cuando usar?", content: "Solo en lineas de BOMBEO: encuentra el diametro donde la suma de tuberia + recibo de luz cuesta menos. Tubo chico = bombeo caro para siempre; tubo grande = inversion inicial alta." },
      { title: "Paso a paso", content: "1. Verifica el caudal (llega solo del proyecto)\n2. Elige las horas de bombeo al dia\n3. Captura longitud y cotas de bomba y tanque\n4. Lee el DN economico (formula de Bresse)\n5. Con un clic lo aplicas a la Linea de conduccion" },
      { title: "Interpretacion", content: "El modulo compara velocidad, perdidas y costo de energia de cada DN\nSi eliges un DN menor al economico veras el sobrecosto de energia\nLa potencia y el costo mensual/anual son de referencia para decidir" },
    ],
  },
  "/despiece": {
    title: "Generador de cruceros — Guia de uso",
    sections: [
      { title: "¿Cuando usar?", content: "Para armar los nudos de piezas (cruceros) de la red: cruces, derivaciones, valvulas, y obtener la lista de materiales con SKU Sigma Flow lista para cotizar." },
      { title: "Paso a paso", content: "1. El DN y el material llegan solos del proyecto\n2. Arma el crucero con los botones visuales: codo, tee, valvula, brida...\n3. Agrega tantos cruceros como nudos tenga tu red\n4. La lista de materiales se consolida sola (suma piezas repetidas)\n5. El despiece pasa automaticamente al reporte" },
      { title: "Interpretacion", content: "Cada pieza lleva su SKU del catalogo Sigma Flow\nEl consolidado agrupa las piezas de todos los cruceros\nUsalo directo para cotizar con tu distribuidor" },
    ],
  },
  "/entregable": {
    title: "Reporte de proyecto — Guia de uso",
    sections: [
      { title: "¿Cuando usar?", content: "El paso FINAL: genera el PDF consolidado con todo lo capturado en el proyecto (demanda, linea, bombeo, protecciones, valvulas y despiece)." },
      { title: "Paso a paso", content: "1. Revisa la portada: nombre del proyecto, localidad, folio y quien elabora\n2. Los datos ya vienen llenos desde los otros pasos — completa a mano lo que falte\n3. Pulsa Generar PDF\n4. Revisa el documento antes de entregarlo" },
      { title: "Interpretacion", content: "El reporte es un PREdimensionamiento: sirve para cotizar y arrancar el proyecto\nNo sustituye al proyecto ejecutivo firmado por un responsable tecnico" },
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
