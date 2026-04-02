import { useMemo, useState } from 'react';
import './EmailPreviewPage.css';

type EmailPreview = {
  id: string;
  category: 'brand' | 'transactional';
  label: string;
  subject: string;
  html: string;
  text: string;
};

function transactionalShell(content: string) {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f6f6f2;color:#111111;padding:32px 16px;line-height:1.65;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #ece7de;border-radius:24px;overflow:hidden;">
    <div style="background:#E5FF00;color:#111111;padding:18px 24px;font-weight:900;font-size:28px;letter-spacing:0.04em;">LEZGO</div>
    <div style="padding:32px 28px;">
      ${content}
    </div>
  </div>
</div>`;
}

function buildWelcomeEmail(firstName: string): EmailPreview {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#111111; line-height:1.65;">
  <div style="max-width:620px; margin:0 auto;">
    <p style="font-size:16px; margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px; margin:0 0 20px;">Soy Tata. Estoy construyendo LEZGO.</p>
    <p style="font-size:16px; margin:0 0 20px;">
      Empecé esto porque quiero una forma mejor de comprar, vender y revender entradas sin el caos de siempre:
      QRs falsos, capturas compartidas, reventa rara, depositarle a un desconocido y cero control para quien organiza.
    </p>
    <p style="font-size:16px; margin:0 0 20px;">
      La idea es simple: tu entrada queda vinculada a tu identidad. En puerta muestras tu documento de identidad y entras.
      Menos fricción, menos fraude, más confianza.
    </p>
    <p style="font-size:16px; margin:0 0 14px;">Acá van 3 cosas que puedes hacer ahora:</p>
    <ol style="font-size:16px; margin:0 0 24px; padding-left:22px;">
      <li style="margin-bottom:8px;"><a href="https://lezgo.fans/eventos" style="color:#0b57d0;">Explora los eventos</a></li>
      <li style="margin-bottom:8px;"><a href="https://lezgo.fans/perfil" style="color:#0b57d0;">Completa tu perfil</a></li>
      <li style="margin-bottom:8px;"><a href="https://lezgo.fans/conocenos" style="color:#0b57d0;">Mira qué estamos construyendo</a></li>
    </ol>
    <p style="font-size:16px; margin:0 0 20px;">Si un día usas Lezgo y algo te encanta o te frustra, escríbeme. Leo personalmente todos los correos, aunque a veces me demore un poquito.</p>
    <p style="font-size:16px; margin:0;">Tata</p>
  </div>
</body>
</html>`;

  const text = `Hey ${firstName},

Soy Tata. Estoy construyendo LEZGO.

Empecé esto porque quiero una forma mejor de comprar, vender y revender entradas sin el caos de siempre: QRs falsos, capturas compartidas, reventa rara, depositarle a un desconocido y cero control para quien organiza.

La idea es simple: tu entrada queda vinculada a tu identidad. En puerta muestras tu documento de identidad y entras. Menos fricción, menos fraude, más confianza.

Acá van 3 cosas que puedes hacer ahora:

1. Explora los eventos — https://lezgo.fans/eventos
2. Completa tu perfil — https://lezgo.fans/perfil
3. Mira qué estamos construyendo — https://lezgo.fans/conocenos

Si un día usas Lezgo y algo te encanta o te frustra, escríbeme. Leo personalmente todos los correos, aunque a veces me demore un poquito.

Tata`;

  return {
    id: 'welcome',
    category: 'brand',
    label: 'Welcome',
    subject: `Bienvenido a LEZGO, ${firstName}`,
    html,
    text,
  };
}

function buildVerifyIdentityEmail(firstName: string): EmailPreview {
  const html = transactionalShell(`
    <p style="font-size:16px;margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px;margin:0 0 20px;">Tu registro en <strong>LEZGO</strong> ya quedó listo.</p>
    <p style="font-size:16px;margin:0 0 20px;">Ahora toca verificar tu identidad para que tus entradas queden vinculadas a ti y el ingreso sea más seguro.</p>
    <p style="font-size:16px;margin:0 0 24px;">
      <a href="https://lezgo.fans/perfil" style="display:inline-block;background:#E5FF00;color:#111111;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:800;">Verificar identidad</a>
    </p>
    <p style="font-size:16px;margin:0 0 20px;">
      Mientras tanto, también puedes
      <a href="https://lezgo.fans/eventos" style="color:#0b57d0;font-weight:600;"> explorar eventos</a>
      o
      <a href="https://lezgo.fans/reventa" style="color:#0b57d0;font-weight:600;"> conocer el marketplace</a>.
    </p>
    <p style="font-size:16px;margin:0;color:#44403a;">Tata y el team de LEZGO</p>
  `);

  const text = `Hey ${firstName},

Tu registro en LEZGO ya quedó listo.

Ahora toca verificar tu identidad para que tus entradas queden vinculadas a ti y el ingreso sea más seguro.

Verificar identidad:
https://lezgo.fans/perfil

Mientras tanto, también puedes explorar eventos:
https://lezgo.fans/eventos

o conocer el marketplace:
https://lezgo.fans/reventa

Tata y el team de LEZGO`;

  return {
    id: 'verify-identity',
    category: 'transactional',
    label: 'Registration successful',
    subject: 'Registro exitoso, ahora verifica tu identidad',
    html,
    text,
  };
}

function buildFirstEventFeedbackEmail(firstName: string): EmailPreview {
  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#ffffff;color:#111111;padding:40px 20px;line-height:1.65;">
  <div style="max-width:620px;margin:0 auto;">
    <p style="font-size:16px; margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px; margin:0 0 20px;">Vi que asististe a tu primer evento con LEZGO.</p>
    <p style="font-size:16px; margin:0 0 20px;">Quería preguntarte algo simple: ¿sentiste que la entrada fue rápida por nuestro lado?</p>
    <p style="font-size:16px; margin:0 0 20px;">Si hubo algo raro, confuso o lento, me sirve muchísimo saberlo.</p>
    <p style="font-size:16px; margin:0;">Tata</p>
  </div>
</div>`;

  const text = `Hey ${firstName},

Vi que asististe a tu primer evento con LEZGO.

Quería preguntarte algo simple: ¿sentiste que la entrada fue rápida por nuestro lado?

Si hubo algo raro, confuso o lento, me sirve muchísimo saberlo.

Tata`;

  return {
    id: 'first-event-feedback',
    category: 'brand',
    label: 'First event feedback',
    subject: '¿Qué tal te fue entrando con LEZGO?',
    html,
    text,
  };
}

function buildPurchaseEmail(firstName: string): EmailPreview {
  const eventName = 'Secuencial presents BRÄT';
  const venue = 'Calle 9, Barranco';
  const time = '23:00 - 06:00';
  const html = transactionalShell(`
    <p style="font-size:16px;margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px;margin:0 0 20px;">Tu compra fue confirmada para <strong>${eventName}</strong>.</p>
    <p style="font-size:16px;margin:0 0 20px;">1 entrada quedó vinculada a tu identidad.</p>
    <p style="font-size:16px;margin:0 0 20px;">
      Venue: ${venue}<br />
      Horario: ${time}
    </p>
    <p style="font-size:16px;margin:0 0 24px;">
      <a href="https://lezgo.fans/mis-entradas" style="display:inline-block;background:#E5FF00;color:#111111;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:800;">Ver mis entradas</a>
    </p>
    <p style="font-size:16px;margin:0 0 20px;">
      Y si te quedaste con ganas de más, puedes
      <a href="https://lezgo.fans/eventos" style="color:#0b57d0;font-weight:600;"> explorar otros eventos</a>.
    </p>
    <p style="font-size:16px;margin:0;color:#44403a;">Si algo se ve raro, responde este email y lo revisamos.</p>
  `);

  const text = `Hey ${firstName},

Tu compra fue confirmada para ${eventName}.

1 entrada quedó vinculada a tu identidad.

Venue: ${venue}
Horario: ${time}

Puedes ver tus entradas aquí:
https://lezgo.fans/mis-entradas

Si algo se ve raro, responde este email y lo revisamos.`;

  return {
    id: 'purchase',
    category: 'transactional',
    label: 'Purchase',
    subject: `Compra confirmada: ${eventName}`,
    html,
    text,
  };
}

function buildGuestlistEmail(firstName: string): EmailPreview {
  const eventName = 'LEZGO Friends & Family Night';
  const html = transactionalShell(`
    <p style="font-size:16px;margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px;margin:0 0 20px;">Tienes un lugar en guestlist para <strong>${eventName}</strong>.</p>
    <p style="font-size:16px;margin:0 0 20px;">Lleva tu documento de identidad al ingreso para que todo fluya rápido en puerta.</p>
    <p style="font-size:16px;margin:0 0 24px;">
      <a href="https://lezgo.fans/auth" style="display:inline-block;background:#E5FF00;color:#111111;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:800;">Crear cuenta o entrar</a>
    </p>
    <p style="font-size:16px;margin:0 0 20px;">
      Mientras tanto, puedes
      <a href="https://lezgo.fans/reventa" style="color:#0b57d0;font-weight:600;"> conocer el marketplace</a>
      o
      <a href="https://lezgo.fans/eventos" style="color:#0b57d0;font-weight:600;"> explorar más eventos</a>.
    </p>
    <p style="font-size:16px;margin:0;color:#44403a;">Nos vemos adentro.</p>
  `);

  const text = `Hey ${firstName},

Te agregaron a la guestlist de ${eventName}.

Lleva tu documento de identidad al ingreso. Si todavía no tienes cuenta, puedes registrarte en https://lezgo.fans/auth

Nos vemos adentro.`;

  return {
    id: 'guestlist',
    category: 'transactional',
    label: 'Guestlist',
    subject: `Estás en guestlist para ${eventName}`,
    html,
    text,
  };
}

export default function EmailPreviewPage() {
  const previews = useMemo(
    () => [
      buildWelcomeEmail('Tata'),
      buildFirstEventFeedbackEmail('Tata'),
      buildVerifyIdentityEmail('Tata'),
      buildPurchaseEmail('Tata'),
      buildGuestlistEmail('Tata'),
    ],
    []
  );
  const [selectedId, setSelectedId] = useState(previews[0].id);
  const selected = previews.find((preview) => preview.id === selectedId) || previews[0];
  const grouped = {
    brand: previews.filter((preview) => preview.category === 'brand'),
    transactional: previews.filter((preview) => preview.category === 'transactional'),
  };

  return (
    <div className="ep">
      <div className="ep-sidebar">
        <div className="ep-eyebrow">Local only</div>
        <h1>Email previews</h1>
        <p>Separados en `brand` y `transactional`, con HTML y texto fallback.</p>

        <div className="ep-section">
          <div className="ep-label">Brand</div>
          <div className="ep-list">
            {grouped.brand.map((preview) => (
              <button
                key={preview.id}
                className={`ep-list-item ${preview.id === selected.id ? 'active' : ''}`}
                onClick={() => setSelectedId(preview.id)}
              >
                <span>{preview.label}</span>
                <small>{preview.subject}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="ep-section">
          <div className="ep-label">Transactional</div>
          <div className="ep-list">
            {grouped.transactional.map((preview) => (
              <button
                key={preview.id}
                className={`ep-list-item ${preview.id === selected.id ? 'active' : ''}`}
                onClick={() => setSelectedId(preview.id)}
              >
                <span>{preview.label}</span>
                <small>{preview.subject}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ep-main">
        <div className="ep-card">
          <div className="ep-card-head">
            <div>
              <div className="ep-label">Subject</div>
              <h2>{selected.subject}</h2>
            </div>
          </div>
          <iframe className="ep-frame" title={selected.subject} srcDoc={selected.html} />
        </div>

        <div className="ep-card">
          <div className="ep-card-head">
            <div className="ep-label">Plain text</div>
          </div>
          <pre className="ep-text">{selected.text}</pre>
        </div>
      </div>
    </div>
  );
}
