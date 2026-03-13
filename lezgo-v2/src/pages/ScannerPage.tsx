import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEventsByOrganizer } from '../services/eventService';
import { getTicketsByEvent, updateTicketStatus } from '../services/ticketService';
import { useTranslation } from '../i18n';
import type { Event, Ticket } from '../lib/types';
import './ScannerPage.css';

interface ScanResult {
  status: 'approved' | 'denied' | 'already-used';
  ticket?: Ticket;
  message: string;
}

export default function ScannerPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      getEventsByOrganizer(user.uid)
        .then((evts) => {
          setEvents(evts.filter((e) => e.status === 'published'));
          if (evts.length > 0) {
            setSelectedEventId(evts[0].id);
          }
        })
        .catch((err) => console.error('Error loading events:', err));
    }
  }, [user?.uid]);

  // Load ticket counts for selected event
  useEffect(() => {
    if (selectedEventId) {
      getTicketsByEvent(selectedEventId)
        .then((tickets) => {
          const used = tickets.filter((t) => t.status === 'used').length;
          setUsedCount(used);
          setTotalSold(tickets.length);
        })
        .catch((err) => console.error('Error loading tickets:', err));
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
        message: t.scanner.errorInvalidDni,
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
          message: t.scanner.errorNotFound,
        });
      } else if (matchingTicket.status === 'used') {
        setResult({
          status: 'already-used',
          message: t.scanner.errorUsed,
        });
      } else {
        // Mark as used
        await updateTicketStatus(matchingTicket.id, 'used');
        setUsedCount((prev) => prev + 1);
        setResult({
          status: 'approved',
          ticket: matchingTicket,
          message: t.scanner.successApproved,
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        status: 'denied',
        message: t.scanner.errorVerifying,
      });
    } finally {
      setScanning(false);
      setDniInput('');
    }
  };

  const percentageUsed = totalSold > 0 ? (usedCount / totalSold) * 100 : 0;

  return (
    <>
      <div className="sc">
        {/* Header */}
        <header className="sc-header">
          <div className="sc-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="2" />
              <circle cx="16" cy="8" r="2" />
              <path d="M12 16c-2 0-4-1-4-3s2-3 4-3 4 1 4 3-2 3-4 3" />
            </svg>
            SCAN.LEZGO.COM
          </div>
          <h1>
            {t.scanner.title} <span>{t.scanner.titleHighlight}</span>
          </h1>
          <p>
            {t.scanner.desc}
          </p>
        </header>

        {/* Scanner Tool Section */}
        <div className="sc-tool">
          {/* Event Selector */}
          <div>
            <label className="sc-tool-label">{t.scanner.selectEvent}</label>
            <select
              className="sc-tool select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">{t.scanner.loadingEvent}</option>
              {(events ?? []).map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name || 'Evento sin nombre'}
                </option>
              ))}
            </select>
          </div>

          {/* Check-in Counter */}
          {selectedEventId && (
            <div className="sc-counter">
              <div className="sc-counter-row">
                <div>
                  <div className="sc-counter-label">{t.scanner.ticketsVerified}</div>
                  <div className="sc-counter-value">
                    {usedCount}/{totalSold}
                  </div>
                </div>
              </div>
              <div className="sc-counter-bar">
                <div
                  className="sc-counter-bar-fill"
                  style={{ width: `${percentageUsed}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* DNI Input */}
          <div className="sc-dni-row">
            <input
              type="text"
              inputMode="numeric"
              placeholder={t.scanner.enterDni}
              className="sc-dni-input"
              value={dniInput}
              onChange={handleDniChange}
              maxLength={8}
              disabled={scanning || !selectedEventId}
            />
            <button
              onClick={handleVerify}
              disabled={scanning || !selectedEventId || dniInput.length !== 8}
              className="sc-dni-btn"
            >
              {scanning ? t.scanner.verifying : t.scanner.verifyBtn}
            </button>
          </div>
        </div>

        {/* Main 2-column Grid */}
        <div className="sc-main">
          {/* Device Mockup - Left */}
          <div className="sc-device">
            <div className="sc-device-inner">
              <div className="sc-viewfinder">
                <div className="sc-viewfinder-corner"></div>
                <div className="sc-viewfinder-corner"></div>
                <div className="sc-viewfinder-corner"></div>
                <div className="sc-viewfinder-corner"></div>
                <div className="sc-scan-line"></div>
                <svg
                  viewBox="0 0 100 120"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '60px', height: '60px', color: 'rgba(255,255,255,0.3)' }}
                >
                  <circle cx="50" cy="30" r="18" fill="currentColor" />
                  <path
                    d="M 30 60 Q 30 50 50 50 Q 70 50 70 60 Q 70 75 50 85 Q 30 75 30 60"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="sc-device-label">Presentar documento frente a cámara</div>
              <div className="sc-device-status">
                <span className="dot"></span>
                Listo para verificar
              </div>
            </div>
          </div>

          {/* Flow Steps - Right */}
          <div className="sc-flow">
            <div className="sc-step">
              <div className="sc-step-num">1</div>
              <div>
                <h3>{t.scanner.presentDocTitle}</h3>
                <p>{t.scanner.presentDocDesc}</p>
              </div>
            </div>
            <div className="sc-step">
              <div className="sc-step-num">2</div>
              <div>
                <h3>{t.scanner.photoVerify}</h3>
                <p>{t.scanner.photoVerifyDesc}</p>
              </div>
            </div>
            <div className="sc-step">
              <div className="sc-step-num">3</div>
              <div>
                <h3>{t.scanner.instantResult}</h3>
                <p>{t.scanner.instantResultDesc}</p>
              </div>
            </div>
            <div className="sc-step">
              <div className="sc-step-num">4</div>
              <div>
                <h3>{t.scanner.collectibleStamp}</h3>
                <p>{t.scanner.collectibleStampDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Examples */}
        <div className="sc-results">
          <div className="sc-result sc-result-ok">
            <div className="sc-result-icon">✓</div>
            <h3>{t.scanner.accessApproved}</h3>
            <p>{t.scanner.approvedDesc}</p>
            <div className="sc-result-detail">
              <div className="sc-result-row">
                <span>{t.scanner.userLabel}</span>
                <span>Juan Pérez</span>
              </div>
              <div className="sc-result-row">
                <span>{t.scanner.dniLabel}</span>
                <span>12345678</span>
              </div>
              <div className="sc-result-row">
                <span>{t.scanner.ticketLabel}</span>
                <span>General</span>
              </div>
            </div>
          </div>

          <div className="sc-result sc-result-fail">
            <div className="sc-result-icon">✕</div>
            <h3>{t.scanner.accessDenied}</h3>
            <p>{t.scanner.deniedDesc}</p>
            <div className="sc-result-detail">
              <div className="sc-result-row">
                <span>Razón</span>
                <span>DNI no encontrado</span>
              </div>
              <div className="sc-result-row">
                <span>Código</span>
                <span>ERROR_NOT_FOUND</span>
              </div>
              <div className="sc-result-row">
                <span>Acción</span>
                <span>Contactar soporte</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stamps Section */}
        <div className="sc-stamps">
          <div className="sc-stamps-header">
            <div className="sc-section-label">{t.scanner.loyaltyTitle}</div>
            <h2>
              {t.scanner.loyaltySubtitle} <span>{t.scanner.stamps}</span>
            </h2>
            <p>
              {t.scanner.loyaltyDesc}
            </p>
          </div>

          <div className="sc-stamps-grid">
            <div className="sc-stamp-card">
              <div className="sc-stamp-icon">🎧</div>
              <div className="sc-stamp-level">{t.scanner.levelRaver}</div>
              <div className="sc-stamp-req">3 {t.scanner.stampsToUnlock}</div>
              <p>{t.scanner.raverDesc}</p>
            </div>
            <div className="sc-stamp-card">
              <div className="sc-stamp-icon">🎤</div>
              <div className="sc-stamp-level">{t.scanner.levelHeadliner}</div>
              <div className="sc-stamp-req">10 {t.scanner.stampsToUnlock}</div>
              <p>{t.scanner.headlinerDesc}</p>
            </div>
            <div className="sc-stamp-card">
              <div className="sc-stamp-icon">👑</div>
              <div className="sc-stamp-level">{t.scanner.levelLegend}</div>
              <div className="sc-stamp-req">25 {t.scanner.stampsToUnlock}</div>
              <p>{t.scanner.legendDesc}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="sc-stats">
          <div className="sc-stat">
            <div className="sc-stat-num">{"<3s"}</div>
            <div className="sc-stat-label">{t.scanner.verification}</div>
          </div>
          <div className="sc-stat">
            <div className="sc-stat-num">0%</div>
            <div className="sc-stat-label">{t.scanner.fraudRate}</div>
          </div>
          <div className="sc-stat">
            <div className="sc-stat-num">📋</div>
            <div className="sc-stat-label">{t.scanner.dniOnly}</div>
          </div>
          <div className="sc-stat">
            <div className="sc-stat-num">⭐</div>
            <div className="sc-stat-label">{t.scanner.stampPerEvent}</div>
          </div>
        </div>
      </div>

      {/* Scan Result Overlay */}
      {result && (
        <div className="scan-result-overlay" onClick={() => setResult(null)}>
          <div
            className={`scan-result-card ${result.status === 'approved' ? 'approved' : 'denied'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="scan-result-icon">
              {result.status === 'approved' && '✓'}
              {result.status === 'denied' && '✕'}
              {result.status === 'already-used' && '⚠'}
            </div>
            <div
              className={`scan-result-status ${result.status === 'approved' ? 'approved' : 'denied'}`}
            >
              {result.status === 'approved' && t.scanner.accessApproved}
              {result.status === 'denied' && t.scanner.accessDenied}
              {result.status === 'already-used' && t.scanner.entryUsed}
            </div>
            {result.ticket && (
              <>
                <div className="scan-result-name">{result.ticket.userName || 'Usuario'}</div>
                <div className="scan-result-detail">{result.ticket.eventName || 'Evento'}</div>
              </>
            )}
            {!result.ticket && (
              <div className="scan-result-detail">{result.message}</div>
            )}
            <div className="scan-result-info">
              {result.ticket && (
                <>
                  <div className="scan-result-row">
                    <span>{t.scanner.dniLabel}</span>
                    <span>{dniInput}</span>
                  </div>
                  <div className="scan-result-row">
                    <span>{t.scanner.ticketLabel}</span>
                    <span>{result.ticket.ticketName || 'General'}</span>
                  </div>
                  <div className="scan-result-row">
                    <span>{t.scanner.statusLabel}</span>
                    <span>{t.scanner.verifiedLabel}</span>
                  </div>
                </>
              )}
              {!result.ticket && (
                <div className="scan-result-row">
                  <span>{t.scanner.errorLabel}</span>
                  <span>{result.message}</span>
                </div>
              )}
            </div>
            <button className={`scan-next-btn ${result.status === 'approved' ? 'approved' : 'denied'}`} onClick={() => setResult(null)}>
              {t.common.next}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
