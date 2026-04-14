"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { HelpButton } from "@/components/ui/HelpModal";

const moduleNames: Record<string, string> = {
  "/tramo-simple": "Verificar presión",
  "/en-serie": "Línea con varios tramos",
  "/golpe-ariete": "Golpe de ariete",
  "/bombeo": "Mi bomba",
  "/dimensionamiento": "Elegir diámetro",
  "/valvulas-aire": "Válvulas de aire",
  "/proyectos": "Mis proyectos",
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
  "/en-serie": {
    title: "Tuberías en Serie — Guia de uso",
    sections: [
      { title: "Cuando usar?", content: "Cuando la linea tiene cambios de diametro, material o pendiente. Cada cambio es un 'tramo'." },
      { title: "Paso a paso", content: "1. Ingresa el caudal Q global de la linea\n2. Ingresa la presión de entrada P1 si la conoces\n3. Clic en '+ Tramo' para agregar tramos\n4. Para cada tramo: longitud, DN, material y cota final\n5. Agrega accesorios por pieza con '+ Agregar'\n6. Los resultados muestran presión al final de cada tramo" },
      { title: "Interpretación", content: "Si la presión en algun tramo cae a cero o negativo, ese punto es critico — rediseñar (aumentar DN o P1)." },
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
};

export function HidroCalcHeader() {
  const pathname = usePathname();
  const moduleName = Object.entries(moduleNames).find(([path]) => pathname.startsWith(path))?.[1] || "";
  const help = Object.entries(moduleHelp).find(([path]) => pathname.startsWith(path))?.[1];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm" style={{ height: 56 }}>
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-[#1C3D5A]/40 hover:text-[#1C3D5A] transition-colors font-medium">
            HidroCalc
          </Link>
          {moduleName && (
            <>
              <span className="text-gray-300">/</span>
              <h1 className="text-sm font-semibold text-[#1C3D5A] tracking-wide">{moduleName}</h1>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {help && <HelpButton moduleTitle={help.title} sections={help.sections} />}
          <span className="text-[10px] text-gray-400 tracking-wider uppercase font-medium hidden sm:block">Solo uso tecnico</span>
        </div>
      </div>
    </header>
  );
}
