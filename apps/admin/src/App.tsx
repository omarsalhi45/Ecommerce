import { Box } from '@chakra-ui/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminLoginPage from './pages/AdminLoginPage'

function App() {
  return (
    <Box minH="100vh" bg="neutral.50">
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
    </Box>
  )
}

export default App
