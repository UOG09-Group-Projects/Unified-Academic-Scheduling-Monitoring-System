import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { PermissionsProvider } from './auth/PermissionsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <PermissionsProvider>
        <App />
      </PermissionsProvider>
    </ToastProvider>
  </StrictMode>,
)
