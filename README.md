# Blue Lemon Bakery — maqueta web

Maqueta funcional para Blue Lemon Bakery (Guayaquil, Ecuador): sitio para el cliente, constructor 3D de tortas y panel de administración.

No tiene backend. Todo corre en el navegador y los datos se guardan en `localStorage`, por eso funciona tal cual en GitHub Pages.

## Qué incluye

| Página | Qué hace |
| --- | --- |
| `index.html` | Sitio público: portada, torta que se arma en 3D con el scroll, catálogo con precios, tamaños, tabla de sabores, combinaciones más pedidas, cómo pedir y contacto. Carrito y checkout que generan el pedido y el mensaje de WhatsApp. |
| `constructor.html` | Constructor 3D interactivo: torta (6 tamaños, incluido de dos pisos), lunch cake (cajita, base o cajita con 2 cupcakes), tiramisú y Cans. Bizcocho, rellenos, cobertura, borde, toppings, topper, mensaje y foto para la polaroid. Vista de corte, animación de armado, descarga de imagen y enlace para compartir el diseño. |
| `admin.html` | Panel de administración: resumen con indicadores, pedidos con cambio de estado y vista 3D del diseño del cliente, agenda de producción, productos y precios, sabores y tamaños disponibles, clientes y ajustes del negocio. |

El sitio y el panel comparten el mismo estado. Un precio que se cambia o un sabor que se apaga en el panel se ve al instante en la web y en el constructor. Un pedido hecho en la web aparece en el panel.

## Verlo en local

Necesita un servidor estático porque usa módulos ES:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

El acceso al panel es de demostración: basta con pulsar "Entrar al panel". En **Ajustes → Restablecer la maqueta** se vuelve al estado inicial.

## Estructura

```
index.html · constructor.html · admin.html
assets/
  css/        base.css (marca y componentes), site.css, builder.css, admin.css, fonts.css
  js/
    data.js     catálogo, estado en localStorage, carrito, pedidos, precios
    cake3d.js   motor 3D (Three.js): tortas, cajita, cupcakes, Cans y animación de armado
    ui.js       cabecera, carrito y checkout
    site.js     sitio público y scroll animado
    builder.js  constructor 3D
    admin.js    panel de administración
  img/        logotipo, isotipo, iconos y fotos extraídos de los catálogos del cliente
  fonts/      Poppins, Marcellus SC, Fraunces y Dancing Script (OFL), alojadas en el sitio
  catalogos/  los dos catálogos PDF originales
vendor/three/ Three.js 0.170 (MIT)
docs/investigacion.md   investigación del negocio, fuentes y supuestos
```

No hay paso de compilación ni dependencias que instalar.

## Sobre el scroll animado

Se evaluó el skill [scroll-world](https://github.com/oso95/scroll-world). Genera con IA de pago una cadena de videos (unos 27 USD por seis escenas) y hace avanzar el video con el scroll. Aquí no hizo falta: la portada usa el mismo motor 3D del constructor y arma la torta capa por capa según el avance del scroll. Pesa menos, no cuesta nada y muestra el producto real en lugar de un video genérico.

Con movimiento reducido activado en el sistema, o sin WebGL, la historia se muestra como una lista normal.

## Datos reales y supuestos

El catálogo, los precios de temporada, los tamaños, los sabores, las combinaciones, el horario, la dirección y la política de pedidos salen de los catálogos del cliente y de su Instagram.

Son supuestos de la maqueta los precios base de torta por tamaño (el catálogo no los publica), los extras del constructor y todos los pedidos y clientes del panel, que son ficticios. El detalle está en [docs/investigacion.md](docs/investigacion.md).

## Pasar a producción

Lo que falta para que deje de ser una maqueta:

1. Backend con base de datos para productos, pedidos y clientes, en lugar de `localStorage`.
2. Autenticación real para el panel.
3. Aviso automático del pedido por WhatsApp o correo, y pasarela de pago o registro de abonos.
4. Fotos propias de cada producto y de los Cans.
5. Validar con el cliente precios, textos y el número de WhatsApp de pedidos.
