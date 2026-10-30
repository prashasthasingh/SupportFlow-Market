import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Grid, QrCode, ShoppingCart, Home, Package, LogOut } from 'lucide-react';

export default function BottomNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const sellerLinks = [
    { to: '/seller/shop', icon: Store, label: 'Shop' },
    { to: '/seller/catalog', icon: Grid, label: 'Catalog' },
    { to: '/seller/add-product', icon: Package, label: 'Add' },
    { to: '/seller/qr', icon: QrCode, label: 'QR Code' },
    { to: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
  ];

  const buyerLinks = [
    { to: '/buyer/feed', icon: Home, label: 'Shops' },
    { to: '/buyer/orders', icon: ShoppingCart, label: 'Orders' },
  ];

  const links = user.role === 'seller' ? sellerLinks : buyerLinks;

  return (
    <nav className="bottom-nav">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <Icon />
          {label}
        </NavLink>
      ))}
      <button
        className="bottom-nav-item"
        onClick={handleLogout}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <LogOut size={22} />
        Logout
      </button>
    </nav>
  );
}
