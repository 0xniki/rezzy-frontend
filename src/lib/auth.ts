export const isUserLoggedIn = (): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    return localStorage.getItem('isLoggedIn') === 'true';
  };
  
  /**
   * Set the user's login state
   */
  export const setUserLoggedIn = (): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true');
    }
  };
  
  /**
   * Log out the user by removing the isLoggedIn flag
   */
  export const logoutUser = (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
    }
  };
  
  /**
   * Mock authentication function - in a real app, this would call an API
   */
  export const authenticateUser = (username: string, password: string): boolean => {
    // Simple mock authentication for demo purposes
    return username === 'admin' && password === 'password';
  };
