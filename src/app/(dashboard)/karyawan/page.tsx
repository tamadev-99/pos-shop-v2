import { enforceRouteAccess, getRolePermissions } from '@/lib/actions/permissions';
import { getEmployeeProfiles } from "@/lib/actions/employee-management";
import KaryawanClient from "./client";


export default async function KaryawanPage() {
    await enforceRouteAccess('/karyawan');
    
    const [employees, rolePermissions] = await Promise.all([
        getEmployeeProfiles(),
        getRolePermissions()
    ]);

    return (
        <KaryawanClient 
            initialEmployees={employees} 
            initialPermissions={rolePermissions}
        />
    );
}
