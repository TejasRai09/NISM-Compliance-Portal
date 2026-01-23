import { useState } from 'react';
import type { Employee, UserRole } from './types';
import AdminPortal from './portals/AdminPortal';
import EmployeePortal from './portals/EmployeePortal';
import LoginPage from './pages/LoginPage';

const App = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);

  if (role === 'employee') return <EmployeePortal employee={employee} onLogout={() => { setRole(null); setEmployee(null); }} />;
  if (role === 'admin') return <AdminPortal onLogout={() => setRole(null)} />;
  return <LoginPage onLogin={(nextRole, nextEmployee) => { setRole(nextRole); setEmployee(nextEmployee || null); }} />;
};

export default App;
