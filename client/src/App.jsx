import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import BottomNav from './components/BottomNav';
import { PrivateRoute } from './components/PrivateRoute';

// Auth pages
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';

// Seller pages
import SellerShopSetupPage from './pages/seller/SellerShopSetupPage';
import SellerAddProductPage from './pages/seller/SellerAddProductPage';
import SellerCatalogPage from './pages/seller/SellerCatalogPage';
import SellerQRPage from './pages/seller/SellerQRPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';

// Buyer pages
import FollowShopPage from './pages/buyer/FollowShopPage';
import BuyerFeedPage from './pages/buyer/BuyerFeedPage';
import ShopDetailPage from './pages/buyer/ShopDetailPage';
import ProductDetailPage from './pages/buyer/ProductDetailPage';
import BuyerOrdersPage from './pages/buyer/BuyerOrdersPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function AppLayout() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/follow/:qrToken" element={<FollowShopPage />} />

        {/* Seller routes */}
        <Route path="/seller/shop" element={<PrivateRoute role="seller"><SellerShopSetupPage /></PrivateRoute>} />
        <Route path="/seller/catalog" element={<PrivateRoute role="seller"><SellerCatalogPage /></PrivateRoute>} />
        <Route path="/seller/add-product" element={<PrivateRoute role="seller"><SellerAddProductPage /></PrivateRoute>} />
        <Route path="/seller/qr" element={<PrivateRoute role="seller"><SellerQRPage /></PrivateRoute>} />
        <Route path="/seller/orders" element={<PrivateRoute role="seller"><SellerOrdersPage /></PrivateRoute>} />

        {/* Buyer routes */}
        <Route path="/buyer/feed" element={<PrivateRoute role="buyer"><BuyerFeedPage /></PrivateRoute>} />
        <Route path="/buyer/shop/:shopId" element={<PrivateRoute role="buyer"><ShopDetailPage /></PrivateRoute>} />
        <Route path="/buyer/product/:productId" element={<PrivateRoute role="buyer"><ProductDetailPage /></PrivateRoute>} />
        <Route path="/buyer/orders" element={<PrivateRoute role="buyer"><BuyerOrdersPage /></PrivateRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppLayout />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a2540',
                color: '#f0f6ff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
              },
              success: {
                iconTheme: { primary: '#14b88a', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: 'white' },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
