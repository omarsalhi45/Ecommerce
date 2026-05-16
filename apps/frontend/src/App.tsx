import { Box } from '@chakra-ui/react'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProfilePage from './pages/ProfilePage'
import SignupPage from './pages/SignupPage'

function App() {
  return (
    <Box minH="100vh" bg="neutral.50">
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </AppLayout>
    </Box>
  )
}

export default App
