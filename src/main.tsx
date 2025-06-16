import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initIOSRecaptchaFixes, preventIOSZoomOnRecaptcha } from './utils/recaptchaHelpers'

// Initialize iOS reCAPTCHA fixes globally
initIOSRecaptchaFixes();
preventIOSZoomOnRecaptcha();

createRoot(document.getElementById("root")!).render(<App />);
