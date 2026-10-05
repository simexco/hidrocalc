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
    title: "Tramo Simple — Guia de uso",
    sections: [
      { title: "Cuando usar este modulo?", content: "Para analizar un tramo de tubería con diámetro y material constante. Ideal para verificar si una linea existente cumple presion, o para diseñar un tramo nuevo." },
      { title: "Modos de calculo", content: "MODO A — Verificar presión de salida:\nConoces: Q, DN, L, P1. Obtienes: la presión al final del tramo.\nUsalo para: verificar si cumple norma (min 1.0 kg/cm2).\n\nMODO B — Calcular caudal maximo:\nConoces: DN, L, P1, P2 minima. Obtienes: el Q maximo sin bajar presión.\nUsalo para: determinar capacidad de una linea existente.\n\nMODO C — Recomendar diametro:\nConoces: Q, L, condiciones de presión. Obtienes: DN minimo que cumple.\nUsalo para: seleccionar diámetro en linea nueva." },
      { title: "Paso a paso (Modo A)", content: "1. Ingresa el caudal Q de diseño en L/s\n2. Selecciona el diámetro nominal DN\n3. Ingresa la longitud total en metros\n4. Selecciona material (C=130 para diseño nuevo)\n5. Ingresa presión disponible P1 en kg/cm2\n6. Si hay desnivel: ingresa cotas de inicio y fin\n7. Agrega accesorios si los conoces\n8. Los resultados aparecen automáticamente\n9. Verifica que P2 >= 1.0 kg/cm2" },
      { title: "Interpretación de resultados", content: "Velocidad V: debe estar entre 0.3 y 2.5 m/s\nGradiente J: óptimo < 5 m/km, aceptable hasta 10 m/km\nPresión salida P2: minimo 1.0 kg/cm2 (10 m.c.a.)\nPerfil hidráulico: la linea piezometrica nunca debe cruzar el terreno" },
    ],
  },
  "/golpe-ariete": {
    title: "Golpe de Ariete — Guia de uso",
    sections: [
      { title: "Cuando usar?", content: "Para determinar la clase de tubería necesaria ante el cierre de una válvula. Obligatorio en lineas con bombeo o válvulas rapidas." },
      { title: "Datos que necesitas", content: "- Velocidad V0: obtener del módulo Tramo Simple\n- Tipo de tuberia: seleccionar del catalogo\n- Tiempo de cierre Tc: dato del fabricante de la valvula\n- Presión estática P0: presión normal de operación\n- Longitud L: de la linea" },
      { title: "Paso a paso", content: "1. Ingresa V0 (velocidad de operación)\n2. Selecciona el tipo de tubería del catalogo\n3. Selecciona diámetro y clase (DR/SDR/K)\n4. Los datos de D, e, E se llenan automáticamente\n5. Ingresa P0, Tc y L\n6. Revisa 'Clase recomendada' y factor de seguridad\n7. Verifica que F.S. >= 1.5" },
      { title: "Interpretación", content: "Cierre lento (Tc >= Tfase): menor sobrepresion\nCierre brusco (Tc < Tfase): maxima sobrepresion\nP minima negativa: riesgo de cavitación\nFactor seg. >= 1.5 recomendado para agua potable" },
    ],
  },
  "/equipo-bombeo": {
    title: "Equipo de bombeo — Guia de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para predimensionar la bomba de un sistema: obtener la Carga Dinámica Total (CDT) y la potencia de referencia (HP) con las que se solicita cotización a un proveedor de bombas." },
      { title: "Los dos casos", content: "CASO 1 — Pozo → Tanque: la bomba está dentro de un pozo y eleva el agua a un tanque. La succión es el NIVEL DINÁMICO del agua (no la profundidad de la bomba).\n\nCASO 2 — Tanque → Red / otro tanque: la bomba toma de un tanque y envía a la red o a otro tanque. Permite varios equipos en paralelo (1, 1+1, 2+1) y elegir el tipo de bomba." },
      { title: "Paso a paso", content: "1. Elegir el caso\n2. Capturar las cotas de succión y entrega (msnm, de Google Earth)\n3. Verificar Q, diámetro, material y longitud (se heredan del proyecto si ya se capturaron en Línea de conducción)\n4. Indicar la presión de servicio en la entrega (0 si solo llena un tanque; 15–20 m.c.a. a red)\n5. Leer los 4 datos para cotizar: CDT, gasto total, gasto por bomba y HP por bomba" },
      { title: "Interpretación", content: "CDT = carga estática + fricción + pérdidas locales + presión de servicio.\nLa potencia mostrada es el HP comercial inmediato superior (eficiencia 70% por defecto).\nEl par Q + CDT es lo que el proveedor necesita para proponer el modelo definitivo.\nVelocidad recomendada en la línea: 0.3 a 2.5 m/s." },
    ],
  },
  "/bombeo": {
    title: "Punto de Operacion — Guia de uso",
    sections: [
      { title: "Cuando usar?", content: "Para encontrar el caudal y altura real de trabajo de una bomba en un sistema especifico." },
      { title: "Datos que necesitas", content: "- Hg: diferencia de cotas succion-descarga\n- P2 remanente: presión minima en destino\n- Curva de bomba: H0 y K del fabricante\n- Sistema: DN, L, material" },
      { title: "Paso a paso", content: "1. Ingresa altura geométrica Hg\n2. Ingresa P2 remanente si aplica (Hs = Hg + P2x10)\n3. Ingresa longitud, DN y material\n4. En 'Bomba' selecciona Ecuacion o Puntos:\n   - Ecuacion: ingresa H0 y K de la ficha tecnica\n   - Puntos: ingresa pares Q-H del fabricante\n5. El grafico muestra la interseccion\n6. Verifica la recomendacion de bomba" },
    ],
  },
  "/dimensionamiento": {
    title: "Dimensionamiento — Guia de uso",
    sections: [
      { title: "Cuando usar?", content: "Para comparar todos los diámetros disponibles y seleccionar el óptimo segun criterios de velocidad y presión." },
      { title: "Paso a paso", content: "1. Ingresa Q de diseño y longitud L\n2. Selecciona material (C=130 para diseño conservador)\n3. Ingresa P1 si la conoces\n4. Define P2 minima requerida (default 1 kg/cm2)\n5. La tabla comparativa aparece automáticamente\n6. DN en VERDE cumplen todos los criterios\n7. Selecciona el DN minimo en verde" },
      { title: "Interpretación de la tabla", content: "V min: velocidad >= 0.3 m/s (sin sedimentación)\nV max: velocidad <= 2.5 m/s (sin erosión)\nPres.: P2 calculada >= P2 minima\nEstado OK: cumple los tres criterios\nREC: DN minimo que cumple todo" },
    ],
  },
  "/valvulas-aire": {
    title: "Válvulas de Aire — Guía de uso",
    sections: [
      { title: "¿Cuándo usar?", content: "Para determinar dónde y qué tamaño de válvula de aire instalar en una línea de conducción nueva o existente. Obligatorio en líneas con puntos altos, pendientes pronunciadas o longitudes mayores a 500 m." },
      { title: "Tipos de válvulas", content: "VA-C (Combinada): Para puntos altos, inicio y fin de línea. Permite entrada y salida de grandes volúmenes de aire.\nVA-A (Admisión/Expulsión): Para pendientes descendentes pronunciadas. Evita vacío durante vaciado rápido.\nVA-E (Eliminadora): Para tramos rectos largos. Expulsa aire acumulado en operación normal." },
      { title: "Paso a paso", content: "1. Ingresa Q, DN y material de la línea\n2. Ingresa P₀ si la conoces (activa cálculo de presiones)\n3. En la tabla de perfil, agrega los vértices del trazo:\n   → Primer vértice: distancia=0, cota del inicio\n   → Incluye TODOS los puntos altos y bajos\n   → Último vértice: punto final\n4. Los resultados aparecen automáticamente\n5. Revisa puntos en rojo (presión crítica)\n6. Exporta el PDF" },
      { title: "Interpretación", content: "VA-C azul: ubicación crítica — instalación obligatoria\nVA-A amarilla: necesaria para vaciado seguro\nVA-E verde: mantenimiento de aire en operación\nFondo rojo: presión insuficiente — revisar diseño\nLínea piezométrica: nunca debe cruzar el perfil del terreno" },
    ],
  },
  "/perfil": {
    title: "Linea de Conduccion — Guia de uso",
    sections: [
      { title: "Cuando usar?", content: "Para diseñar o verificar una línea de conducción completa. Cargas el perfil topografico, defines los tramos de tuberia (DN y material) y el modulo calcula la presion en cada punto. Tambien puedes comparar escenarios y calcular la P1 requerida." },
      { title: "Datos que necesitas", content: "- Perfil topografico: pares de (cadenamiento, cota del terreno)\n- Caudal Q de diseño (Qmd conduccion / Qmh distribucion)\n- Diametro DN, material y clase de la tuberia" },
      { title: "Paso a paso", content: "1. Captura o importa el perfil del terreno (el ultimo punto define la longitud)\n2. Elige que diseñas (conduccion o red) y verifica el caudal\n3. Define los tramos de tuberia (material, DN, clase)\n4. El sistema calcula la P1 REQUERIDA para cumplir la presion minima\n5. Revisa puntos en rojo (presion critica) o amarillo (presion baja)" },
      { title: "Interpretacion", content: "Verde (OK): presion cumple el minimo\nAmarillo (Baja): presion menor al minimo pero positiva\nRojo (Critica): presion negativa — la linea no funciona ahi\nLa linea piezometrica nunca debe cruzar el perfil del terreno" },
    ],
  },
  "/vrp": {
    title: "Valvula Reductora de Presion — Guia de uso",
    sections: [
      { title: "Cuando usar?", content: "Para seleccionar el tamaño correcto de válvula reductora de presión (VRP) en una linea donde se necesita reducir la presion aguas abajo. Comun en redes de distribucion con zonas de diferente presion." },
      { title: "Datos que necesitas", content: "- Caudal maximo Q: demanda pico de la zona aguas abajo\n- Caudal minimo Q (opcional): demanda minima para verificar estabilidad\n- Presion aguas arriba P1: medida con manometro antes de la VRP\n- Presion objetivo P2: la presion deseada despues de la VRP\n- DN de la linea: diametro de la tuberia donde se instalara" },
      { title: "Paso a paso", content: "1. Ingresa el caudal maximo Q de diseño\n2. Opcionalmente ingresa Q minimo\n3. Ingresa P1 (presion de entrada) y P2 (presion deseada)\n4. Selecciona el DN de la linea\n5. Los resultados aparecen automaticamente\n6. Revisa la tabla de seleccion y las advertencias" },
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
