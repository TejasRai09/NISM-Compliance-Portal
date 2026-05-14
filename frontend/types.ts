export type UserRole = 'employee' | 'admin' | null;
export type ActiveView = 'dashboard' | 'upload' | 'profile' | 'employees' | 'review' | 'certificates';
export type CertStatus = 'Compliant' | 'Expiring Soon' | 'Expired' | 'Pending Approval' | 'Rejected';

export interface Certificate {
  id: string;
  moduleName: string;
  certNumber: string;
  issueDate: string;
  expiryDate: string;
  fileName: string;
  status: CertStatus;
  filePath?: string;
  employeeId?: string;
  employeeName?: string;
  employeeNumber?: string;
}

export interface Employee {
  employeeNumber: string;
  name: string;
  designation: string;
  department: string;
  location: string;
  email: string;
  phone: string;
  managerEmail: string;
  managerEmployeeNo: string;
  managerName: string;
  mandatoryCertificates?: string[];
}

export interface MandatoryCertStatus {
  certificateType: string;
  id: string | null;
  certNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: CertStatus | 'Not Uploaded';
  filePath: string | null;
}
