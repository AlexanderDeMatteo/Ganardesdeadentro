# Guía de Prueba - Sistema de Métricas

## Inicio Rápido

### 1. Inicia la Aplicación
```bash
cd /vercel/share/v0-project
pnpm dev
```

### 2. Accede a la Aplicación
- URL: `http://localhost:3000`
- Ve a la página de Login
- Usa las credenciales de prueba:
  - Email: `test@example.com`
  - Contraseña: `password123`

## Flujo de Prueba

### Fase 1: Explorar Dashboard
1. Accede al Dashboard (`/dashboard`)
2. En el sidebar derecho, busca **"Métricas Recientes"**
3. Verifica que muestre:
   - Peso: 85.5 kg
   - Grasa Corporal: 18.5%
   - Masa Muscular: 35.2 kg
4. Los cambios deben mostrar:
   - Peso: -2.5 kg (verde ↓)
   - Grasa Corporal: -1.2% (verde ↓)
   - Masa Muscular: +3.1 kg (verde ↑)

### Fase 2: Navegar a Métricas Completas
1. Desde dashboard, haz clic en **"Ver Todos los Gráficos"** en la tarjeta de métricas
2. O navega directamente a `/metrics`
3. Deberías ver:
   - 3 tarjetas resumen en la parte superior
   - Botón "Agregar Nueva Medición"
   - 6 gráficos interactivos

### Fase 3: Explorar Gráficos
1. Observa los 6 gráficos:
   - Progreso de Peso
   - Grasa Corporal
   - Masa Muscular
   - Cintura
   - Bíceps, Pecho, Muslos, Cadera, Pantorrillas

2. Interacción con gráficos:
   - Pasa el mouse sobre las líneas
   - Verifica que aparezca tooltip con fecha y valor
   - Observa puntos azules en cada medición

### Fase 4: Agregar Nueva Medición
1. Haz clic en **"Agregar Nueva Medición"**
2. Se expandirá un formulario con campos para:
   - Peso, Grasa Corporal, Masa Muscular
   - Bíceps, Pecho, Cintura, Cadera, Muslos, Pantorrillas
   - Notas opcionales

3. Llena algunos campos (puedes llenar solo algunos):
   - Peso: 84.5
   - Grasa Corporal: 18.0
   - Masa Muscular: 35.5
   - Cintura: 78

4. Añade una nota: "Me veo más definido"

5. Haz clic en **"Guardar Medición"**

6. Verifica que:
   - El formulario se cierre
   - Las tarjetas de resumen se actualicen con nuevos valores
   - Los gráficos muestren la nueva medición (punto extra)
   - Los cambios sean correctos

### Fase 5: Verificar Cambios
1. Las tarjetas deben mostrar:
   - Peso: 84.5 kg (cambio: -1.0 kg, verde)
   - Grasa Corporal: 18.0% (cambio: -0.5%, verde)
   - Masa Muscular: 35.5 kg (cambio: +0.3 kg, verde)

2. Los gráficos deben mostrar:
   - Línea más larga (5 puntos ahora)
   - Nueva medición con el punto más reciente

### Fase 6: Probar Responsividad
1. Abre DevTools (F12)
2. Activa modo responsive (Ctrl+Shift+M)
3. Prueba en diferentes tamaños:
   - **Mobile (375px)**:
     - Formulario: 2 columnas
     - Gráficos: 1 columna
     - Stats: 1 columna
   
   - **Tablet (768px)**:
     - Formulario: 2 columnas
     - Gráficos: 2 columnas
     - Stats: 3 filas
   
   - **Desktop (1200px)**:
     - Formulario: 3 columnas
     - Gráficos: 2 columnas
     - Stats: 3 columnas

### Fase 7: Verificar Persistencia
1. Abre la consola de desarrollador
2. Recarga la página (F5)
3. Verifica que:
   - Los gráficos mantienen todos los datos
   - La nueva medición está ahí
   - Los cambios persisten

4. Opcionalmente, cierra el navegador y reabre
5. Inicia sesión nuevamente
6. Las métricas deben estar intactas

### Fase 8: Pruebas de Edge Cases
1. **Llenar solo un campo**:
   - Abre formulario
   - Llena solo "Peso"
   - Guarda
   - Verifica que la tarjeta de peso se actualice

2. **Agregar notas**:
   - Abre formulario
   - Llena algunos números
   - Añade una nota larga
   - Guarda y verifica

3. **Gráfico vacío**:
   - En la consola del navegador ejecuta:
   ```javascript
   localStorage.removeItem('fittrack_metrics')
   ```
   - Recarga la página
   - Los gráficos deben decir "No hay datos"
   - Agrega una medición
   - El gráfico debe mostrar 1 punto

## Checklist de Validación

### Funcionalidad
- [ ] Datos mock cargan correctamente
- [ ] Formulario se abre/cierra sin errores
- [ ] Nuevas mediciones se guardan
- [ ] Cambios se calculan correctamente
- [ ] Gráficos se actualizan en tiempo real
- [ ] Datos persisten al recargar
- [ ] Datos persisten en sesiones diferentes

### Diseño
- [ ] Colores son consistentes con la paleta
- [ ] Gradientes se ven bien
- [ ] Iconos tienen tamaño correcto
- [ ] Espaciado es uniforme
- [ ] Sombras/transiciones funcionan

### Responsividad
- [ ] Mobile: sin overflow horizontal
- [ ] Tablet: layout lógico
- [ ] Desktop: aprovecha espacio
- [ ] Inputs son clicables en mobile

### Indicadores
- [ ] Flechas de cambio correctas (↑/↓)
- [ ] Colores de cambio (verde/rojo) correctos
- [ ] Negativos mostrados con signo correcto

### Gráficos
- [ ] Ejes tienen etiquetas legibles
- [ ] Líneas suave y contínua
- [ ] Tooltips aparecen al pasar mouse
- [ ] Puntos de datos visibles
- [ ] Leyenda es informativa

## Troubleshooting

### Los gráficos se ven vacíos
- Verifica que localStorage tenga datos: `console.log(JSON.parse(localStorage.getItem('fittrack_metrics')))`
- Si está vacío, recarga la página

### El formulario no guarda
- Abre la consola (F12)
- Busca errores en rojo
- Verifica que los números sean válidos
- Comprueba que localStorage no esté lleno

### Las métricas no persisten
- Verifica que localStorage esté habilitado
- En navegador privado/incógnito podrían no persistir

### Los gráficos se ven pixelados
- Problema de renderizado de Recharts
- Intenta recargar la página
- Limpia cache del navegador

## Comandos Útiles para Testing

```javascript
// Ver todas las métricas guardadas
JSON.parse(localStorage.getItem('fittrack_metrics'))

// Limpiar métricas
localStorage.removeItem('fittrack_metrics')

// Agregar métrica de prueba manualmente
localStorage.setItem('fittrack_metrics', JSON.stringify([
  {
    id: '1',
    date: new Date().toISOString(),
    weight: 80,
    bodyFat: 15,
    muscleMass: 40
  }
]))
```

## Casos de Uso Adicionales

### Simular Varias Semanas
1. Agrega mediciones múltiples con distintas fechas
2. Usa la consola para agregar fechas pasadas:
```javascript
// En la consola
const metrics = JSON.parse(localStorage.getItem('fittrack_metrics'));
metrics.push({
  id: Date.now().toString(),
  date: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
  weight: 86,
  bodyFat: 20
});
localStorage.setItem('fittrack_metrics', JSON.stringify(metrics));
```

### Probar con Muchos Datos
- Agrega 20+ mediciones para ver cómo se comportan los gráficos
- Verifica que Recharts siga siendo responsive

## Conclusión

Una vez completado este flujo de prueba, el sistema de métricas está listo para usar en producción. Todos los aspectos de funcionalidad, diseño y experiencia del usuario han sido validados.
