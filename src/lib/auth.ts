// Mock authentication for static frontend
export async function validateAdminCredentials(email: string, password: string) {
  // Simple mock authentication - replace with actual backend API calls
  if (email === 'admin@spectrum4.ca' && password === 'admin123') {
    return {
      id: '1',
      email: email
    };
  }
  
  return null;
}