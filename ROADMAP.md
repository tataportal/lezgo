# LEZGO v2 — Nice to Have (Roadmap)

Cosas que quedaron en el tintero o ideas que surgieron durante desarrollo. No son blockers para launch.

---

## UX / Features

- [ ] **Watchlist / Favoritos**
  Ícono de corazón en cada EventCard y en la página de detalle del evento. Al marcarlo se guarda en una colección `watchlist` en Firestore bajo el uid del usuario. En /eventos agregar un toggle/filtro "Mis favoritos" que solo muestra los eventos marcados. Útil para que el usuario haga seguimiento de eventos que le interesan pero aún no compra.

- [ ] **Notificaciones de eventos**
  Cuando un evento que el usuario tiene en watchlist cambia (nuevo artista en lineup, se agota un tier, cambio de fecha/venue, o se re-abre stock), disparar una notificación. Puede ser push (Firebase Cloud Messaging) o email (SendGrid/Resend). Incluir configuración en perfil para elegir canal y frecuencia.

- [ ] **Compartir evento**
  Botón de share en la página del evento y opcionalmente en las cards. Usar Web Share API en móvil (abre el sheet nativo de compartir). En desktop, copiar link al clipboard con feedback visual. Considerar generar una imagen OG dinámica por evento para que se vea bien en WhatsApp/IG stories.

- [ ] **Mapa interactivo**
  En /eventos, agregar un toggle "Mapa" al lado de "Grid". Mostrar un mapa (Mapbox o Google Maps) con pins en cada venue. Al hacer click en un pin se abre un popup con los eventos de ese venue. Requiere que cada evento tenga lat/lng en Firestore (hoy solo tiene string de location).

- [ ] **Filtro por género/tags**
  Fila de chips horizontales scrolleables debajo de los filtros actuales (Ubicación, Fechas, Buscar). Cada chip es un género: Techno, House, DNB, Experimental, etc. Se pueden seleccionar múltiples. Los géneros se extraen dinámicamente del campo `genre` de los eventos. Visualmente como pills con borde que se llenan de color ácido al activarse.

- [ ] **Vista lista vs grid**
  Dos íconos (grid/lista) al lado del contador "11 eventos". Grid es el actual con EventCards. Lista es una tabla compacta tipo Spotify: fila con miniatura, nombre, fecha, venue, precio — más info visible sin scroll. Ya existe algo parecido en el HomePage (date list view) pero hacerlo reutilizable.

- [ ] **Historial de eventos**
  Tab o sección en /perfil que muestre eventos pasados a los que asististe (tickets escaneados). Cada uno con la card del evento, fecha, y opcionalmente un botón para dejar review. Sirve como "memoria" de lo que has vivido. Query: tickets del usuario donde `scannedAt` < hoy, join con evento.

- [ ] **Reviews / Ratings**
  Después de que un evento termina (fecha pasada + ticket escaneado), el usuario puede dejar un rating (1-5 estrellas) y un comentario corto (máx 280 chars). Se muestra en la página del organizador/promotor como social proof. Moderación básica: reportar review, solo 1 review por usuario por evento.

- [ ] **Referral system**
  Cada usuario tiene un código de referido único (ej: `TATA2026`). Al compartirlo y que alguien compre un ticket con ese código, ambos reciben un beneficio (descuento en próxima compra, badge especial, o crédito). Tracking en Firestore: quién refirió a quién, cuántas conversiones. Dashboard básico en perfil mostrando referidos y recompensas.

- [ ] **Dark/Light mode toggle**
  Actualmente todo el app es dark mode. Agregar un toggle en Settings del perfil (y opcionalmente en el header) que cambie entre dark y light. Implementar con CSS custom properties: duplicar los tokens de color en un `[data-theme="light"]` selector. Persistir preferencia en localStorage y respetar `prefers-color-scheme` del sistema como default.

---

## Compra / Tickets

- [ ] **Checkout multi-ticket**
  Hoy se compra 1 ticket a la vez. Permitir agregar múltiples tickets de distintos tiers al carrito antes de pagar. UI: selectores de cantidad por tier en la página del evento, resumen de orden antes de confirmar. Backend: una sola transacción de Firestore que crea múltiples documentos de ticket atómicamente.

- [ ] **Waiting list**
  Cuando un evento o tier está sold out, mostrar botón "Avisame cuando haya cupo" en vez de "Agotado". Se guarda el email/uid en una cola. Cuando alguien cancela o el organizador libera más tickets, se notifica al siguiente en la cola con un link de compra temporal (expira en X minutos para que no se quede muerto).

- [ ] **Early bird pricing**
  El organizador puede configurar escalones de precio en un tier. Ej: primeros 50 tickets a S/80, siguientes 100 a S/100, resto a S/120. O por fecha: antes del 1 de abril S/80, después S/120. El precio se calcula dinámicamente al momento de compra. Mostrar countdown o "quedan X al precio actual" para urgencia.

- [ ] **Códigos de descuento**
  El organizador crea cupones desde su dashboard: código alfanumérico, porcentaje o monto fijo de descuento, cantidad máxima de usos, fecha de expiración, y opcionalmente restringido a tiers específicos. En checkout el usuario ingresa el código y se valida en tiempo real. Guardar uso en Firestore para tracking.

- [ ] **Split payment**
  Para grupos que van juntos: un usuario arma la orden (ej: 4 tickets) y genera un link de pago dividido. Cada amigo abre el link y paga su parte. Los tickets se emiten cuando todos han pagado. Timeout de 24h: si no completan, se cancela y libera el stock. Complejo pero muy pedido en la escena.

- [ ] **Transferencia de entrada**
  Un usuario con ticket puede transferirlo a otro usuario registrado en LEZGO. Se invalida el QR original y se genera uno nuevo para el receptor. Historial de transferencia visible para el organizador. Límite: máximo 1 transferencia por ticket para evitar reventa encubierta (o sin límite si el orga lo permite).

---

## Organizadores

- [ ] **Analytics avanzados**
  Expandir el dashboard de /organizer con: funnel de conversión (vistas → clicks → compras), heatmap de horarios de compra (para saber cuándo promocionar), breakdown demográfico si disponible, revenue por tier, comparativa entre eventos. Gráficos con Recharts o similar.

- [ ] **Email marketing**
  Desde el dashboard del organizador, poder enviar un email blast a todos los asistentes de un evento anterior. Templates predefinidos: "Nuevo evento", "Cambio de lineup", "Last call". Integración con SendGrid/Resend. Tracking de opens y clicks. Límite para no spamear.

- [ ] **Customización de página del promotor**
  En /promotor/:name el organizador puede subir su logo, elegir color de acento, banner hero, bio, y links de redes. Hoy es estático. Hacer que el organizador edite esto desde su dashboard. Los colores se aplican como CSS vars override en su página pública.

- [ ] **Multi-scanner**
  Actualmente /scanner funciona desde un solo dispositivo. Para eventos grandes necesitas varios puntos de escaneo. Implementar: cada scanner se identifica con un nombre (ej: "Puerta A"), todas las lecturas van a Firestore en tiempo real, y un dashboard muestra el conteo live de ingresados por puerta. Prevenir doble scan entre dispositivos con un lock optimista.

- [ ] **Seating map**
  Para venues con asientos numerados (teatros, estadios). El organizador sube un SVG del plano del venue y mapea zonas/asientos a tiers. El comprador ve el mapa interactivo, elige su asiento, y el asiento queda bloqueado durante el checkout. Complejo pero necesario si LEZGO expande a conciertos grandes.

---

## Técnico

- [ ] **PWA completa**
  Agregar service worker con Workbox para cache de assets y offline básico (ver tickets comprados sin internet). Manifest.json para install prompt en Android/iOS. Splash screen con logo LEZGO. Push notifications vía Firebase Cloud Messaging para notis de eventos.

- [ ] **SSR / SSG**
  Las páginas de eventos necesitan ser indexables por Google para SEO. Hoy es full SPA (Vite + React) así que Google ve una página vacía. Opciones: migrar a Next.js/Remix para SSR, o usar un servicio de pre-rendering (Prerender.io). Prioridad: páginas de evento individual y la lista de eventos.

- [ ] **i18n portugués**
  Agregar PT-BR como cuarto idioma. Duplicar el archivo de traducciones `es.ts` → `pt.ts`, traducir todo. Agregar bandera de Brasil al selector de idioma. Relevante si LEZGO se expande a Brasil que tiene escena electrónica grande (São Paulo, etc).

- [ ] **Tests E2E**
  Flujos críticos que no pueden romperse: registro → login → comprar ticket → ver en mis entradas → scan QR. Implementar con Playwright (más rápido que Cypress). Correr en CI (GitHub Actions) en cada PR. Mock de Firebase con emulators. Target: cubrir los 5 flujos más importantes.

- [ ] **Rate limiting**
  Los endpoints de compra (`/api/checkout`, `/api/create-ticket`) necesitan rate limiting para evitar bots que compren masivamente. Implementar en el API (Vercel edge middleware o Firebase Functions). Límite: máx 5 compras por IP por minuto, máx 10 por usuario por hora. Captcha como fallback.

- [ ] **Image optimization**
  Los flyers de eventos son JPG/PNG pesados. Implementar: conversión automática a WebP/AVIF al subir, múltiples tamaños (thumbnail, card, hero), servir desde CDN (Cloudflare Images o similar), lazy loading con blur placeholder (como Next/Image pero manual). Reducir el LCP significativamente.

- [ ] **Accessibility audit**
  Hacer una auditoría WCAG 2.1 AA: contraste de colores (especialmente el ácido sobre negro), focus indicators en todos los interactivos, alt text en imágenes, aria-labels en botones de solo ícono, navegación por teclado completa, screen reader testing. Herramientas: axe-core, Lighthouse accessibility.

---

## Reventa / Marketplace

- [ ] **Precio sugerido**
  Cuando un usuario lista un ticket en reventa, sugerir un precio justo basado en: precio original del tier, demanda actual (cuánta gente en waiting list), días hasta el evento, y precios de otras listings del mismo evento. Mostrar como "Precio sugerido: S/XX" debajo del input de precio. No obligatorio pero guía al vendedor.

- [ ] **Verificación anti-scalping**
  El organizador puede configurar un markup máximo permitido en reventa (ej: máx 20% sobre precio original). Si alguien intenta listar a un precio mayor, se rechaza o se muestra warning. Protege a los compradores y mantiene la reputación del organizador. Configurable por evento desde el dashboard.

- [ ] **Chat entre comprador/vendedor**
  Mensajería in-app entre el comprador interesado y el vendedor de un ticket en reventa. Para preguntar detalles, negociar precio, o coordinar. Implementar con Firestore realtime (colección `chats`). Notificación cuando recibes mensaje. UI: burbuja de chat tipo WhatsApp, accesible desde el listing.

- [ ] **Escrow automático**
  Al comprar un ticket de reventa, el dinero no va directo al vendedor sino que queda retenido (escrow). Se libera al vendedor solo cuando el QR del ticket es escaneado exitosamente en la puerta del evento, confirmando que el ticket era válido. Si el ticket no funciona, refund automático al comprador. Requiere integración con pasarela de pago que soporte holds (Stripe Connect, Mercado Pago split).

---

*Última actualización: Marzo 2026*
