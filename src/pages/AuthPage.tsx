import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { sanitizeIdInput, isValidId, ID_CONFIG, type IdType } from '../lib/constants';
import { Button, Card, Field, Icon, Input, SectionHeading, Stack, TabButton, Tabs } from '../components/ui';
import toast from 'react-hot-toast';
import './AuthPage.css';

type AuthTab = 'login' | 'register';

/* Google SVG icon — same as monolith */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09a6.97 6.97 0 0 1 0-4.17V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.41l3.56-2.84.01-.48z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading, loginWithGoogle, loginWithPassword, sendMagicLink, updateProfile } = useAuth();
  const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const [tab, setTab] = useState<AuthTab>('login');
  const [regStep, setRegStep] = useState(1); // 1=account, 2=dni+success
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [idType, setIdType] = useState<IdType>('dni');
  const [dni, setDni] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      // If user just registered via Google, advance to step 2
      if (tab === 'register' && regStep === 1) {
        setRegStep(2);
        if (user.displayName) setName(user.displayName);
        return;
      }
      // If on login tab or already past step 1, go to profile
      if (tab === 'login') {
        navigate('/perfil');
      }
    }
  }, [user, loading, navigate, tab, regStep]);

  if (loading) {
    return (
      <div className="auth-view">
        <div className="auth-logo">{t.auth.logo}</div>
        <Card className="auth-card auth-card--loading" raised glow>
          <div className="auth-body" style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div className="auth-spinner" />
            <div className="auth-loading-text">{t.common.loading}</div>
          </div>
        </Card>
      </div>
    );
  }

  /* ── Handlers ── */
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      if (tab === 'login') {
        toast.success(t.auth.welcomeToast);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(error.message || t.auth.errorLogin);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t.auth.errorEmail);
      return;
    }
    try {
      setIsLoading(true);
      await sendMagicLink(email);
      setLinkSent(true);
      toast.success(t.auth.linkSent);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || t.auth.errorSendLink);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      toast.error('Enter the test email and password.');
      return;
    }
    try {
      setIsLoading(true);
      await loginWithPassword(email, password);
      toast.success('Dev login successful.');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Could not sign in with password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishRegister = async () => {
    if (!name.trim()) {
      toast.error(t.auth.errorName);
      return;
    }
    if (!isValidId(dni, idType)) {
      toast.error(
        idType === 'dni' ? t.auth.errorDni :
        idType === 'ce' ? t.auth.errorCarnet :
        t.auth.errorPassport
      );
      return;
    }
    if (!user) { toast.error(t.auth.errorNoAccount); return; }
    try {
      setIsLoading(true);
      await updateProfile({ displayName: name.trim(), dni: dni.trim() });
      setShowSuccess(true);
    } catch {
      toast.error(t.auth.errorRegister);
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (t: AuthTab) => {
    setTab(t);
    setRegStep(1);
    setEmail('');
    setPassword('');
    setName('');
    setDni('');
    setLinkSent(false);
    setShowSuccess(false);
  };

  /* ── Steps bar for register (2 steps: account + identity) ── */
  const StepsBar = () => (
    <div className="auth-steps-bar">
      {[1, 2].map(s => (
        <span
          key={s}
          className={s < regStep ? 'done' : s === regStep ? 'active' : ''}
        />
      ))}
    </div>
  );

  return (
    <div className="auth-view">
      <div className="auth-logo" onClick={() => navigate('/inicio')}>{t.auth.logo}</div>

      <Card className="auth-card" raised glow padded={false}>
        {/* ── Tabs ── */}
        <Tabs className="auth-tabs">
          <TabButton
            className="auth-tab"
            active={tab === 'login'}
            onClick={() => switchTab('login')}
          >
            {t.auth.loginTab}
          </TabButton>
          <TabButton
            className="auth-tab"
            active={tab === 'register'}
            onClick={() => switchTab('register')}
          >
            {t.auth.registerTab}
          </TabButton>
        </Tabs>

        <div className="auth-body">
          {/* ════════════════════════════════════════
             LOGIN PANEL
             ════════════════════════════════════════ */}
          {tab === 'login' && (
            <>
              <SectionHeading title={t.auth.welcomeBack} body={t.auth.loginDesc} />

              <Button className="auth-btn-google" variant="secondary" onClick={handleGoogleLogin} disabled={isLoading}>
                <GoogleIcon />
                {t.auth.googleBtn}
              </Button>

              <div className="auth-divider"><span>{t.auth.orEmail}</span></div>

              <Field label={t.auth.emailLabel}>
                <Input
                  className="auth-input"
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                  disabled={isLoading}
                />
              </Field>
              <Button className="auth-btn-magic" onClick={handleMagicLink} disabled={isLoading}>
                {t.auth.sendMagicLink}
              </Button>

              {isLocalDev && (
                <Stack className="auth-dev-panel">
                  <div className="auth-dev-title">Local testing access</div>
                  <div className="auth-dev-sub">
                    Use email + password only for localhost promoter testing.
                  </div>
                  <Field label="Password">
                    <Input
                      className="auth-input"
                      type="password"
                      placeholder="Enter test password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                      disabled={isLoading}
                    />
                  </Field>
                  <Button className="auth-btn-dev" variant="secondary" onClick={handlePasswordLogin} disabled={isLoading}>
                    Sign in with password
                  </Button>
                </Stack>
              )}

              {linkSent && (
                <div className="auth-link-sent">
                  <div className="auth-link-sent-icon">{t.auth.linkSentIcon}</div>
                  <strong>{t.auth.linkSentTitle}</strong><br />
                  {t.auth.linkSentDesc}<br />
                  <span className="auth-link-sent-sub">{t.auth.linkSentAutoLogin}</span>
                </div>
              )}

              <div className="auth-switch">
                {t.auth.noAccount}{' '}
                <a onClick={() => switchTab('register')}>{t.auth.createHere}</a>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════
             REGISTER PANEL
             ════════════════════════════════════════ */}
          {tab === 'register' && (
            <>
              <StepsBar />

              {/* ── Step 1: Create account ── */}
              {regStep === 1 && !showSuccess && (
                <div className="auth-step active">
                  <SectionHeading title={t.auth.createAccount} body={t.auth.createDesc} />

                  <Button className="auth-btn-google" variant="secondary" onClick={handleGoogleLogin} disabled={isLoading}>
                    <GoogleIcon />
                    {t.auth.googleBtn}
                  </Button>

                  <div className="auth-divider"><span>{t.auth.orEmail}</span></div>

                  <Field label={t.auth.emailLabel}>
                    <Input
                      className="auth-input"
                      type="email"
                      placeholder={t.auth.emailPlaceholder}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                      disabled={isLoading}
                    />
                  </Field>
                  <Button className="auth-btn-magic" onClick={handleMagicLink} disabled={isLoading}>
                    {t.auth.sendMagicLink}
                  </Button>

                  {linkSent && (
                    <div className="auth-link-sent">
                      <div className="auth-link-sent-icon">{t.auth.linkSentIcon}</div>
                      <strong>{t.auth.linkSentTitle}</strong><br />
                      {t.auth.linkSentDesc}<br />
                      <span className="auth-link-sent-sub">{t.auth.linkSentRegisterDesc}</span>
                    </div>
                  )}

                  <div className="auth-switch">
                    {t.auth.hasAccount}{' '}
                    <a onClick={() => switchTab('login')}>{t.auth.loginHere}</a>
                  </div>
                </div>
              )}

              {/* ── Step 2: DNI + Name ── */}
              {regStep === 2 && !showSuccess && (
                <div className="auth-step active">
                  <SectionHeading title={t.auth.verifyTitle} body={t.auth.verifyDesc} />

                  <Field label={t.auth.fullName}>
                    <Input
                      className="auth-input"
                      type="text"
                      placeholder={t.auth.fullNamePlaceholder}
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </Field>

                  <Field label={t.auth.docType}>
                  <select
                    className="auth-input auth-select ds-v3-input"
                    value={idType}
                    onChange={e => { setIdType(e.target.value as IdType); setDni(''); }}
                  >
                    <option value="dni">{t.auth.dni}</option>
                    <option value="ce">{t.auth.carnet}</option>
                    <option value="pasaporte">{t.auth.passport}</option>
                  </select>
                  </Field>

                  <Field label={idType === 'dni' ? t.auth.dniNumber : idType === 'ce' ? t.auth.carnetNumber : t.auth.passportNumber}>
                    <Input
                      className="auth-input"
                      type="text"
                      placeholder={idType === 'dni' ? t.auth.dniPlaceholder : idType === 'ce' ? t.auth.carnetPlaceholder : t.auth.passportPlaceholder}
                      maxLength={ID_CONFIG[idType].maxLength}
                      value={dni}
                      onChange={e => setDni(sanitizeIdInput(e.target.value, idType))}
                    />
                  </Field>

                  <div className="auth-security-note">
                    <Icon name="lock" size={14} /> {t.auth.dniSafe}
                  </div>

                  <Button className="auth-btn auth-btn--spaced" onClick={handleFinishRegister} disabled={isLoading}>
                    {isLoading ? t.common.loading : t.auth.createAccount}
                  </Button>
                  <Button className="auth-btn-ghost" variant="secondary" onClick={() => setRegStep(1)}>
                    {t.auth.goBack}
                  </Button>
                </div>
              )}

              {/* ── Success state ── */}
              {showSuccess && (
                <div className="auth-step active">
                  <div className="auth-success-icon"><Icon name="confetti" size={30} /></div>
                  <SectionHeading title={t.auth.successTitle} body={t.auth.successDesc} />
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div className="auth-verified-badge"><Icon name="id" size={14} /> {t.auth.successBadge}</div>
                  </div>
                  <Button className="auth-btn" onClick={() => navigate('/inicio')}>
                    {t.auth.exploreEvents}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── Legal ── */}
          <div className="auth-legal">
            {t.auth.termsPrefix}{' '}
            <a href="/terminos" target="_blank" rel="noreferrer">{t.auth.termsLink}</a> {t.auth.andText}{' '}
            <a href="/privacidad" target="_blank" rel="noreferrer">{t.auth.privacyLink}</a> {t.auth.termsSuffix}
          </div>
        </div>
      </Card>
    </div>
  );
}
