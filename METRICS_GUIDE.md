# Guía de Métricas - FitTrack

## Descripción General

La sección de **Métricas** de FitTrack te permite registrar y seguir todas las medidas de tu cuerpo para monitorear tu progreso en tu transformación fitness.

## Medidas que Puedes Registrar

### Medidas Principales
- **Peso (kg)**: Tu peso corporal actual
- **Grasa Corporal (%)**: Porcentaje de grasa en tu cuerpo (manual de báscula o estimado por la app)
- **Masa Muscular (kg)**: Cantidad de masa muscular (manual o estimada a partir del peso y la grasa)

### Composición corporal automática

La app puede **calcular por ti** la grasa corporal y la masa muscular si:

1. Indicas **peso** en la medición.
2. Tienes el **perfil completo** en [Mi perfil](/profile): talla (cm), edad (18+) y sexo.

**Cómo usarlo**

- Guarda una medición con **peso** y perfil completo.
- Si dejas grasa/masa vacías, el sistema las completa automáticamente al guardar.

**Fórmulas (estimación orientativa, no diagnóstico médico)**

| Valor | Método |
|-------|--------|
| Grasa corporal (%) | Deurenberg: BMI + edad + sexo |
| Masa muscular (kg) | Masa magra = peso × (1 − %grasa/100); músculo ≈ 50 % de la magra (hombre) o 45 % (mujer) |

Si tu báscula ya muestra % grasa o kg de músculo, introdúcelos manualmente: tienen prioridad sobre el cálculo automático.

En resúmenes y gráficos, los valores estimados aparecen con el sufijo **(est.)**.

### Medidas Circunferenciales (cm)
- **Bíceps (izq/der)**: Circunferencia de ambos brazos
- **Pecho**: Circunferencia del pecho
- **Cintura**: Circunferencia de la cintura
- **Cadera**: Circunferencia de la cadera
- **Muslos (izq/der)**: Circunferencia de ambas piernas
- **Pantorrillas (izq/der)**: Circunferencia de ambas pantorrillas

## Cómo Usar la Sección de Métricas

### Agregar una Nueva Medición

1. Ve a la sección **Métricas** desde el menú de navegación
2. Haz clic en el botón **"Agregar Nueva Medición"**
3. Completa los campos que desees (no es obligatorio llenarlos todos)
4. Añade notas si lo consideras necesario (opcional)
5. Haz clic en **"Guardar Medición"**

### Visualizar tu Progreso

Una vez que hayas registrado mediciones, podrás:

- **Ver tarjetas de resumen** con tus últimas medidas y el cambio desde la medición anterior
- **Visualizar gráficos interactivos** que muestran la tendencia de cada métrica a lo largo del tiempo
- **Acceder rápidamente desde el Dashboard** a un resumen de tus métricas más importantes

## Cómo Leer los Gráficos

### Interpretación de Colores
- **Línea de tendencia** en color primario (púrpura/azul)
- **Puntos en los gráficos** indican cada medición registrada
- **Eje X**: Fechas de las mediciones
- **Eje Y**: Valores de la métrica

### Cambios Positivos vs Negativos
Dependiendo de la métrica:

| Métrica | Cambio Positivo | Cambio Negativo |
|---------|-----------------|-----------------|
| Peso | ↓ Bajando (verde) | ↑ Subiendo (rojo) |
| Grasa Corporal | ↓ Bajando (verde) | ↑ Subiendo (rojo) |
| Masa Muscular | ↑ Subiendo (verde) | ↓ Bajando (rojo) |
| Circunferencias | ↓ Bajando (verde) | ↑ Subiendo (rojo) |

## Consejos para Mediciones Precisas

1. **Mide en las mismas condiciones**: Idealmente a la misma hora del día
2. **Usa la misma balanza**: Para mayor consistencia en el peso
3. **Mide con cinta métrica**: Para circunferencias, asegúrate que esté recta y cómoda
4. **Frecuencia**: Registra mediciones una vez a la semana o cada dos semanas
5. **Anota cambios**: Los pequeños cambios son normales; lo importante es la tendencia general

## Almacenamiento de Datos

- Todas tus métricas se guardan **localmente en tu navegador** (localStorage)
- Los datos **persisten** incluso si cierras el navegador
- Las métricas están **vinculadas a tu usuario/sesión**

## Ejemplos de Progreso Esperado

### Ganancia de Masa Muscular
- Peso: Puede aumentar ligeramente
- Grasa Corporal: Disminuye
- Masa Muscular: Aumenta
- Circunferencias: Aumentan en brazos y pecho, disminuyen en cintura

### Pérdida de Peso
- Peso: Disminuye
- Grasa Corporal: Disminuye
- Masa Muscular: Se mantiene o aumenta (con ejercicio)
- Circunferencias: Disminuyen en general

## Preguntas Frecuentes

### ¿Por qué mi peso aumentó aunque trabajo duro?
El peso puede fluctuar por razones como retención de agua, aumento de masa muscular, o variaciones normales. Enfócate en la tendencia general a largo plazo.

### ¿Con qué frecuencia debo medir?
Se recomienda una vez por semana o cada 10-14 días. Medir muy seguido puede ser desmoralizante si no ves cambios rápidos.

### ¿Todas las medidas son importantes?
No necesariamente. Enfócate en las que se alineen con tus objetivos:
- **Pérdida de peso**: Peso, grasa corporal
- **Ganancia de músculo**: Masa muscular, circunferencias
- **Tono general**: Todas

### ¿Qué hago si cometo un error?
Puedes corregirlo desde **Historial biométrico** usando **Editar** o **Eliminar** en la fila del registro.

## Integración con tu Plan de Entrenamiento

Tus métricas te ayudan a:
- **Validar tu rutina**: ¿Te está dando resultados?
- **Ajustar intensidad**: Si no ves progreso, puede ser hora de intensificar
- **Mantener motivación**: Ver gráficos de progreso es muy motivador
- **Personalizar rutinas**: Los entrenadores pueden ajustar planes basándose en tus resultados
