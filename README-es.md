# dsh-font-enhancer

> Personaliza, por región, la tipografía de la interfaz de DSH: fuente, tamaño, interlineado, grosor, cursiva y color. Incluye creación de regiones por selección en pantalla, estilos unificados, temas guardados, paletas aleatorias, instalación de 8 fuentes "cute" con un clic y un catálogo de 128 skins compartido con las otras dos bolas flotantes.

> Documentación completa: [README en inglés](./README.md) · [中文速查](./README-zh.md)

## De un vistazo

| Capacidad | Detalle |
|---|---|
| Ajustes por región | **10** regiones integradas; cada una con fuente china/inglesa, tamaño, interlineado, grosor (100–900), cursiva y color |
| Selección de región | Haz clic en elementos de la página en vivo y crea tu propia región — sin escribir selectores CSS |
| Unificado | Tres interruptores (color / fuente / cursiva) que se aplican a todas las regiones activas |
| Temas | Guarda toda la configuración como tema con nombre; aplica, renombra, elimina |
| Aleatorio | 🎲 fuente aleatoria, 🎨 paleta aleatoria (paso de ángulo áureo) |
| Instalación de fuentes | **8** fuentes "cute" con un clic (con progreso); también puedes subir tu .ttf/.otf |
| Skins | **128** skins compartidas con dsh-todo-float-ball y dsh-skill-browser, sincronizadas en tiempo real |
| Persistencia | localStorage + respaldo en `settings.json` del host; sobrevive a refrescos, reinicios y actualizaciones |
| Plataformas | Web GUI de DSH y escritorio (Electron) |

## Las 10 regiones integradas

Todas se localizan mediante atributos estables **`data-slot`**, inmunes a los cambios de las clases hash de CSS-Modules.

1. Barra lateral · 2. Área de chat · 3. Cabecera del chat · 4. Área de entrada · 5. Progreso de todo ·
6. Espacio de trabajo · 7. Información del chat · 8. Marca/Logo · 9. Barra lateral inferior izquierda · 10. Barra inferior de información del chat (nueva en v1.5.2)

## Fuentes

- **18 chinas** · **18 inglesas** · **8 instalables con un clic** — Comic Neue viene **incluida en el paquete**; las otras 7 se descargan en el primer uso (LXGW WenKai, Smiley Sans, ZCOOL KuaiLe, Baloo 2, Fredoka, Nunito, Caveat)
- Por defecto: inglés Times New Roman, chino 楷体

## Skins (128, compartidas por las tres bolas)

招牌特效 28 · 浓郁深底 38 · 尘埃灰调 20 · 柔光深底 15 · 中性点缀 10 · 浅色纸面 17

## Cómo usar el panel

1. Pulsa la bola **Aa** (abajo a la derecha)
2. Arriba: selector de tema + nombre + **💾 Guardar** / **Aplicar** / ✏ Renombrar / ✕ Borrar
3. Centro: los tres interruptores de **Unificado** + **🖱 Seleccionar región** + **🎲 Fuente aleatoria** + **🎨 Color aleatorio** + **🔄 Refrescar**
4. Abajo: una tarjeta por región — marca la casilla, fuentes a la izquierda, tamaño/grosor/cursiva/color a la derecha
5. Al final: instalación de fuentes "cute" + añadir tu propio archivo de fuente

## Instalación

```bash
dsh plugin --profile desktop add dsh-font-enhancer
```

O busca "字体" en el mercado de plugins.

**Error conocido**: si aparece `minimumReleaseAge` o `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, no está roto: DSH aplica una ventana de seguridad de 24 h a los paquetes npm recién publicados. Espera un día y vuelve a intentarlo.

## Dónde se guardan los datos

| Ubicación | Contenido |
|---|---|
| localStorage | Configuración de regiones, temas, estado unificado, skin elegida |
| `settings.json` del host | Copia de seguridad — `~/.dsh/data/dsh-font-enhancer/settings.json` |
| Fuentes instaladas | Directorio de fuentes del host, servido en `/dsh-font-enhancer/fonts/*` |

En escritorio el origen cambia en cada reinicio, así que localStorage puede estar vacío; entonces se restaura desde `settings.json`.

## Preguntas frecuentes

**¿El estilo no se aplica?** Pulsa **🔄 Refrescar** en el panel, o el botón "重载" de DSH, o cierra y vuelve a abrir la bola.

**¿Instalé la fuente pero no aparece en la lista?** En escritorio pulsa 🔄 Refrescar; en web, F5.

**¿El interruptor Unificado está activo y lo aleatorio no hace nada?** Con unificado activo, lo aleatorio cambia el valor unificado, no cada región — es el comportamiento diseñado.

**¿La región creada por selección desaparece tras reiniciar?** Corregido en v1.5.2. Si aún falla, usa **🖱 Resaltar** para ver cuántos elementos coinciden; "ningún elemento coincidente" significa que la estructura del frontend de DSH cambió y hay que volver a seleccionar.

## Licencia

MIT · [GitHub Issues](https://github.com/loyalchiiina/dsh-font-enhancer/issues)
