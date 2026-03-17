import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEventsByOrganizer } from '../services/eventService';
import { apiFetch } from '../lib/api';
import { sanitizeIdInput, isValidId, ID_CONFIG, type IdType } from '../lib/constants';
import { useTranslation } from '../i18n';
import type { Event } from '../lib/types';
import './ScannerPage.css';

interface ScanResult {
  status: 'approved' | 'denied' | 'already-used';
  data?: { userName: string; ticketName: string; eventName?: string; usedAt?: unknown };
  message: string;
}

export default function ScannerPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [scannerIdType, setScannerIdType] = useState<IdType>('dni');
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

  // Load ticket counts for selected event via API (no PII exposure)
  useEffect(() => {
    if (selectedEventId) {
      apiFetch<{ usedCount: number; totalSold: number }>(`scanner-stats?eventId=${selectedEventId}`, { method: 'GET' })
        .then((stats) => {
          setUsedCount(stats.usedCount);
          setTotalSold(stats.totalSold);
        })
        .catch((err) => console.error('Error loading stats:', err));
    }
  }, [selectedEventId]);

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDniInput(sanitizeIdInput(e.target.value, scannerIdType));
  };

  const handleVerify = async () => {
    if (!dniInput || !isValidId(dniInput, scannerIdType) || !selectedEventId) {
      setResult({
        status: 'denied',
        message: t.scanner.errorInvalidDni,
      });
      return;
    }

    setScanning(true);
    try {
      const response = await apiFetch<ScanResult>('scanner-verify', {
        method: 'POST',
        body: { eventId: selectedEventId, dni: dniInput, idType: scannerIdType },
      });

      if (response.status === 'approved') {
        setUsedCount((prev) => prev + 1);
      }

      setResult({
        status: response.status,
        data: response.data,
        message:
          response.status === 'approved' ? t.scanner.successApproved :
          response.status === 'already-used' ? t.scanner.errorUsed :
          response.message || t.scanner.errorNotFound,
      });
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
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
                  {event.name || (t.scanner.unnamedEvent || 'Evento sin nombre')}
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

          {/* ID Type Selector + Input */}
          <div className="sc-dni-row">
            <select
              className="sc-id-type-select"
              value={scannerIdType}
              onChange={(e) => { setScannerIdType(e.target.value as IdType); setDniInput(''); }}
              disabled={scanning || !selectedEventId}
            >
              <option value="dni">{t.scanner.idTypeDni || 'DNI'}</option>
              <option value="ce">{t.scanner.idTypeCe || 'CE'}</option>
              <option value="pasaporte">{t.scanner.idTypePassport || 'Pasaporte'}</option>
            </select>
            <input
              type="text"
              inputMode={ID_CONFIG[scannerIdType].digitsOnly ? 'numeric' : 'text'}
              placeholder={(t.scanner.idType || 'Ingresa') + ' ' + (scannerIdType === 'dni' ? (t.scanner.idTypeDni || 'DNI') : scannerIdType === 'ce' ? (t.scanner.idTypeCe || 'CE') : (t.scanner.idTypePassport || 'Pasaporte'))}
              className="sc-dni-input"
              value={dniInput}
              onChange={handleDniChange}
              maxLength={ID_CONFIG[scannerIdType].maxLength}
              disabled={scanning || !selectedEventId}
            />
            <button
              onClick={handleVerify}
              disabled={scanning || !selectedEventId || !isValidId(dniInput, scannerIdType)}
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
              <div className="sc-device-label">{t.scanner.presentDoc}</div>
              <div className="sc-device-status">
                <span className="dot"></span>
                {t.scanner.readyToVerify}
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
                <span>{t.scanner.reasonLabel}</span>
                <span>{t.scanner.dniNotFound}</span>
              </div>
              <div className="sc-result-row">
                <span>{t.scanner.codeLabel}</span>
                <span>ERROR_NOT_FOUND</span>
              </div>
              <div className="sc-result-row">
                <span>{t.scanner.actionLabel}</span>
                <span>{t.scanner.contactSupport}</span>
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
            {result.data && (
              <>
                <div className="scan-result-name">{result.data.userName || (t.scanner.unknownUser || 'Usuario')}</div>
                <div className="scan-result-detail">{result.data.eventName || (t.scanner.unknownEvent || 'Evento')}</div>
              </>
            )}
            {!result.data && (
              <div className="scan-result-detail">{result.message}</div>
            )}
            <div className="scan-result-info">
              {result.data && (
                <>
                  <div className="scan-result-row">
                    <span>{t.scanner.dniLabel}</span>
                    <span>••••••••</span>
                  </div>
                  <div className="scan-result-row">
                    <span>{t.scanner.ticketLabel}</span>
                    <span>{result.data.ticketName || 'General'}</span>
                  </div>
                  <div className="scan-result-row">
                    <span>{t.scanner.statusLabel}</span>
                    <span>{t.scanner.verifiedLabel}</span>
                  </div>
                </>
              )}
              {!result.data && (
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
