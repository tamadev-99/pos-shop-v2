import { getCustomers } from "@/lib/actions/customers";
import { getEmployees } from "@/lib/actions/employees";
import KontakClient from "./kontak-client";

export default async function KontakPage() {
    const [customers, employees] = await Promise.all([
        getCustomers(),
        getEmployees(),
    ]);

    return (
        <KontakClient
            initialCustomers={customers as any}
            initialEmployees={employees as any}
        />
    );
}
