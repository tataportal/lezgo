import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

type AuthTab = 'login' | 'register';
type RegisterStep = 'contact' | 'dni' | 'success';

const GOOGLE_ICON = '🔍';
const MAGIC_LINK_ICON = '✨';
const CHECKMARK_ICON = '✅';
const MAIL_ICON = '📬';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, loginWithGoogle, sendMagicLink } = useAuth();
  const [tab, setTab] = useState<AuthTab>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('contact');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/perfil');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-loading">Cargando...</div>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      toast.success('¡Bienvenido a LEZGO!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Ingresa tu correo');
      return;
    }

    try {
      setIsLoading(true);
      await sendMagicLink(email);
      setSentEmail(email);
      setEmailSent(true);
      toast.success('Link mágico enviado');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar link';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterDni = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !dni) {
      toast.error('Completa todos los campos');
      return;
    }

    if (dni.length !== 8 || !/^\d+$/.test(dni)) {
      toast.error('DNI debe tener 8 dígitos');
      return;
    }

    setRegisterStep('success');
  }; return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">LEZGO</div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login');
              setRegisterStep('contact');
              setEmail('');
              setName('');
              setDni('');
              setEmailSent(false);
              setSentEmail('');
            }}
          >
            Iniciar sesión
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register');
              setRegisterStep('contact');
              setEmail('');
              setName('');
              setDni('');
              setEmailSent(false);
              setSentEmail('');
            }}
          >
            Crear cuenta
          </button>
        </div>

        {/* Login Tab */}
        {tab === 'login' && (
          <div className="auth-content">
            {!emailSent ? (
              <>
                <button
                  className="auth-button auth-button--google"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <span className="auth-button-icon">{GOOGLE_ICON}</span>
                  Continuar con Google
                </button>

                <div className="auth-divider">
                  <span>o</span>
                </div>

                <form onSubmit={handleMagicLink}>
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="auth-button auth-button--primary"
                    disabled={isLoading}
                  >
                    Enviar link mágico {MAGIC_LINK_ICON}
                  </button>
                </form>
              </>
            ) : (
              <div className="auth-confirmation">
                <div className="auth-confirmation-icon">{MAIL_ICON}</div>
                <h3>Revisa tu correo</h3>
                <p>Hemos enviado un link mágico a:</p>
                <p className="auth-confirmation-email">{sentEmail}</p>
                <button
                  className="auth-button auth-button--ghost"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                >
                  Usar otro correo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Register Tab */}
        {tab === 'register' && (
          <div className="auth-content">
            {registerStep === 'contact' && !emailSent ? (
              <>
                <button
                  className="auth-button auth-button--google"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <span className="auth-button-icon">{GOOGLE_ICON}</span>
                  Continuar con Google
                </button>

                <div className="auth-divider">
                  <span>o</span>
                </div>

                <form onSubmit={handleMagicLink}>
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="auth-button auth-button--primary"
                    disabled={isLoading}
                  >
                    Enviar link mágico {MAGIC_LINK_ICON}
                  </button>
                </form>
              </>
            ) : registerStep === 'contact' && emailSent ? (
              <div className="auth-confirmation">
                <div className="auth-confirmation-icon">{MAIL_ICON}</div>
                <h3>Revisa tu correo</h3>
                <p>Hemos enviado un link mágico a:</p>
                <p className="auth-confirmation-email">{sentEmail}</p>
                <p className="auth-confirmation-info">
                  Una vez confirmes tu correo, completa tu perfil en la siguiente pantalla.
                </p>
                <button
                  className="auth-button auth-button--ghost"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                >
                  Usar otro correo
                </button>
              </div>
            ) : registerStep === 'dni' ? (
              <>
                <h3 className="auth-step-title">Verificar identidad</h3>
                <form onSubmit={handleRegisterDni}>
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    placeholder="DNI (8 dígitos)"
                    value={dni}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setDni(value);
                    }}
                    className="auth-input"
                    disabled={isLoading}
                    maxLength={8}
                  />
                  <button
                    type="submit"
                    className="auth-button auth-button--primary"
                    disabled={isLoading}
                  >
                    Verificar identidad
                  </button>
                </form>
              </>
            ) : (
              <div className="auth-confirmation">
                <div className="auth-confirmation-icon auth-confirmation-icon--success">
                  {CHECKMARK_ICON}
                </div>
                <h3>Identidad verificada</h3>
                <p>¡Bienvenido a LEZGO, {name}!</p>
                <p className="auth-confirmation-info">
                  Tu cuenta ha sido creada exitosamente. Ahora puedes explorar eventos y comprar entradas.
                </p>
                <button
                  className="auth-button auth-button--primary"
                  onClick={() => navigate('/inicio')}
                >
                  Ir a eventos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
