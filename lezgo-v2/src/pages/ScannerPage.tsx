import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEventsByOrganizer } from '../services/eventService';
import { getTicketsByEvent, updateTicketStatus } from '../services/ticketService';
import type { Event, Ticket } from '../lib/types';
import './ScannerPage.css';

interface ScanResult {
  status: 'approved' | 'denied' | 'already-used';
  ticket?: Ticket;
  message: string;
}

export default function ScannerPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [dniInput, setDniInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [usedCount, setUsedCount] = useState(0);
  const [totalSold, setTotalSold] = useState(0);

  // Load organizer's events
  useEffect(() => {
    if (user?.uid) {
      getEventsByOrganizer(user.uid).then((evts) => {
        setEvents(evts.filter((e) => e.status === 'published'));
        if (evts.length > 0) {
          setSelectedEventId(evts[0].id);
        }
      }).catch((err) => console.error('Error loading events:', err));
    }
  }, [user?.uid]);

  // Load ticket counts for selected event
  useEffect(() => {
    if (selectedEventId) {
      getTicketsByEvent(selectedEventId).then((tickets) => {
        const used = tickets.filter((t) => t.status === 'used').length;
        setUsedCount(used);
        setTotalSold(tickets.length);
      }).catch((err) => console.error('Error loading tickets:', err));
    }
  }, [selectedEventId]);

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setDniInput(value);
  };

  const handleVerify = async () => {
    if (!dniInput || dniInput.length !== 8 || !selectedEventId) {
      setResult({
        status: 'denied',
        message: 'Ingresa un DNI válido (8 dígitos)',
      });
      return;
    }

    setScanning(true);
    try {
      const tickets = await getTicketsByEvent(selectedEventId);
      const matchingTicket = tickets.find(
        (t) => t.userDni === dniInput && t.status !== 'transferred'
      );

      if (!matchingTicket) {
        setResult({
          status: 'denied',
          message: 'No hay entrada registrada con este DNI',
        });
      } else if (matchingTicket.status === 'used') {
        setResult({
          status: 'already-used',
          message: 'Esta entrada ya fue utilizada',
        });
      } else {
        // Mark as used
        await updateTicketStatus(matchingTicket.id, 'used');
        setUsedCount((prev) => prev + 1);
        setResult({
          status: 'approved',
          ticket: matchingTicket,
          message: '✓ Acceso aprobado',
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        status: 'denied',
        message: 'Error verificando entrada',
      });
    } finally {
      setScanning(false);
      setDniInput('');
    }
  };

  const percentageUsed = totalSold > 0 ? (usedCount / totalSold) * 100 : 0;

  return (
    <div className="scanner-page">
      <header className="scanner-header">
        <div className="scanner-badge">SCAN.LEZGO.COM</div>
        <h1>Verificación en puerta</h1>
        <p>Sistema de control de acceso para eventos LEZGO</p>
      </header>

      <div className="scanner-container">
        {/* Scanner Tool Section */}
        <div className="scanner-tool">
          {/* Event Selector */}
          <div className="event-selector">
            <label>Selecciona un evento</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">Cargar evento...</option>
              {(events ?? []).map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name || 'Evento sin nombre'}
                </option>
              ))}
            </select>
          </div>

          {/* Check-in Counter */}
          {selectedEventId && (
            <div className="checkin-counter">
              <div className="counter-stat">
                <div className="counter-label">Entradas verificadas</div>
                <div className="counter-value">
                  {usedCount}/{totalSold}
                </div>
              </div>
              <div className="counter-bar">
                <div
                  className="counter-fill"
                  style={{ width: `${percentageUsed}%` }}
                ></div>
              </div>
              <div className="counter-percent">{Math.round(percentageUsed)}%</div>
            </div>
          )}

          {/* DNI Input */}
          <div className="dni-input-container">
            <div className="dni-input-wrapper">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ingresa DNI (8 dígitos)"
                value={dniInput}
                onChange={handleDniChange}
                maxLength={8}
                disabled={scanning || !selectedEventId}
              />
              <button
                onClick={handleVerify}
                disabled={scanning || !selectedEventId || dniInput.length !== 8}
                className="verify-btn"
              >
                {scanning ? 'Verificando...' : 'Verificar →'}
              </button>
            </div>
          </div>

          {/* Scanner Visual Mockup */}
          <div className="scanner-mockup">
            <div className="device-frame">
              <div className="device-screen">
                <div className="scanner-viewfinder">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                  <div className="scan-line"></div>
                </div>
                <div className="face-silhouette">
                  <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="30" r="18" fill="currentColor" />
                    <path
                      d="M 30 60 Q 30 50 50 50 Q 70 50 70 60 Q 70 75 50 85 Q 30 75 30 60"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Result Cards */}
          {result && (
            <div className={`result-card result-${result.status}`}>
              <div className="result-icon">
                {result.status === 'approved' && '✓'}
                {result.status === 'denied' && '✕'}
                {result.status === 'already-used' && '⚠'}
              </div>
              <div className="result-message">{result.message}</div>
              {result.ticket && (
                <div className="result-details">
                  <div className="result-name">{result.ticket.userName || 'Usuario'}</div>
                  <div className="result-event">{result.ticket.eventName || 'Evento'}</div>
                  <div className="result-tier">{result.ticket.ticketName || 'Entrada'}</div>
                </div>
              )}
            </div>
          )}

          {/* Flow Steps */}
          <div className="flow-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-label">Presenta documento</div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-label">Foto verificación</div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-label">Resultado instantáneo</div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-label">Stamp</div>
            </div>
          </div>
        </div>

        {/* Stamps Section */}
        <div className="stamps-section">
          <h2>Programas de lealtad</h2>
          <div className="stamp-cards">
            <div className="stamp-card">
              <div className="stamp-tier">Raver</div>
              <div className="stamp-count">3 stamps</div>
            </div>
            <div className="stamp-card">
              <div className="stamp-tier">Headliner</div>
              <div className="stamp-count">10 stamps</div>
            </div>
            <div className="stamp-card">
              <div className="stamp-tier">Leyenda</div>
              <div className="stamp-count">25 stamps</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat">
            <div className="stat-icon">⚡</div>
            <div className="stat-label">&lt;3s verification</div>
          </div>
          <div className="stat">
            <div className="stat-icon">🔒</div>
            <div className="stat-label">0% fraud</div>
          </div>
          <div className="stat">
            <div className="stat-icon">🆔</div>
            <div className="stat-label">ID-only</div>
          </div>
          <div className="stat">
            <div className="stat-icon">⭐</div>
            <div className="stat-label">Stamp per event</div>
          </div>
        </div>
      </div>
    </div>
  );
}
