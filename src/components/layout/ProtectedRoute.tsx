import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  requirePromoter?: boolean;
}

export default function ProtectedRoute({ children, requirePromoter }: Props) {
  const { user, loading, isPromoter } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="branded-loader">
          <div className="branded-loader-logo">LEZGO</div>
          <div className="branded-loader-bars">
            <span /><span /><span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requirePromoter && !isPromoter) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
