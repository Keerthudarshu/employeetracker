interface SessionData {
  sessionToken: string;
  userType: 'employee' | 'admin';
  user: any;
}

class AuthManager {
  private sessionKey = 'eduPrajna_session';

  setSession(data: SessionData): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(data));
  }

  getSession(): SessionData | null {
    const data = localStorage.getItem(this.sessionKey);
    return data ? JSON.parse(data) : null;
  }

  clearSession(): void {
    localStorage.removeItem(this.sessionKey);
  }

  getAuthHeaders(): Record<string, string> {
    const session = this.getSession();
    return session?.sessionToken 
      ? { 'Authorization': `Bearer ${session.sessionToken}` }
      : {};
  }

  isAuthenticated(): boolean {
    return !!this.getSession();
  }

  isEmployee(): boolean {
    const session = this.getSession();
    return session?.userType === 'employee';
  }

  isAdmin(): boolean {
    const session = this.getSession();
    return session?.userType === 'admin';
  }

  getCurrentUser() {
    const session = this.getSession();
    return session?.user || null;
  }
}

export const authManager = new AuthManager();
