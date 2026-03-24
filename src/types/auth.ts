export interface User {
  id: string;
  email: string;
  role: 'admin' | 'tester';
  name: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'tester') => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: 'admin' | 'tester';
}
