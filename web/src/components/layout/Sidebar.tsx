import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

interface NavItem { to: string; label: string; icon: string }

const patientNav: NavItem[] = [
  { to: '/dashboard', label: 'nav.dashboard', icon: '🏠' },
  { to: '/records', label: 'nav.records', icon: '📋' },
  { to: '/appointments', label: 'nav.appointments', icon: '🗓' },
  { to: '/observations', label: 'nav.observations', icon: '🔔' },
  { to: '/wearables', label: 'nav.wearables', icon: '⌚' },
  { to: '/export', label: 'nav.export', icon: '📄' },
  { to: '/settings', label: 'nav.settings', icon: '⚙️' },
];

const doctorNav: NavItem[] = [
  { to: '/doctor/patients', label: 'nav.patients', icon: '👥' },
  { to: '/doctor/observations', label: 'nav.observations', icon: '🔬' },
  { to: '/settings', label: 'nav.settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = user?.role === 'doctor' ? doctorNav : patientNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <span className="text-2xl">💜</span>
        <span className="text-lg font-semibold text-indigo-600">Sentido</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span>{item.icon}</span>
            {t(item.label)}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <p className="text-xs text-gray-500 mb-1 truncate">{user?.fullName}</p>
        <button
          onClick={handleLogout}
          className="text-xs text-red-500 hover:text-red-700"
        >
          {t('auth.logout')}
        </button>
      </div>
    </aside>
  );
}
