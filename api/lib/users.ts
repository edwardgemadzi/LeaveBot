// User Management System
// In production, use a proper database like PostgreSQL or MongoDB

export interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'supervisor' | 'team_member';
  created_by?: number;
  created_at: number;
  supervisor_id?: number;
}

// Default users - in production, seed these in database
const defaultUsers: User[] = [
  {
    id: 1,
    name: 'Edward Gemadzi',
    username: 'edgemadzi',
    password: 'admin123', // In production, hash this!
    role: 'admin',
    created_at: Date.now(),
  },
];

// In-memory user storage (use database in production)
let users: User[] = [...defaultUsers];
let nextId = 2;

export function getAllUsers(): User[] {
  return [...users];
}

export function getUserByUsername(username: string): User | undefined {
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function getUserById(id: number): User | undefined {
  return users.find(u => u.id === id);
}

export function createUser(userData: Omit<User, 'id' | 'created_at'>): User {
  const newUser: User = {
    ...userData,
    id: nextId++,
    created_at: Date.now(),
  };
  
  users.push(newUser);
  return newUser;
}

export function updateUser(id: number, updates: Partial<User>): User | null {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  users[index] = { ...users[index], ...updates };
  return users[index];
}

export function deleteUser(id: number): boolean {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  
  users.splice(index, 1);
  return true;
}

export function getUsersByRole(role: User['role']): User[] {
  return users.filter(u => u.role === role);
}

export function getUsersBySupervisor(supervisorId: number): User[] {
  return users.filter(u => u.supervisor_id === supervisorId);
}
