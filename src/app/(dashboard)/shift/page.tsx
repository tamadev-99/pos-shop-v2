import { getActiveShifts, getShiftHistory } from "@/lib/actions/shifts";
import { getUsers } from "@/lib/actions/settings";
import ShiftClient from "./shift-client";

export default async function ShiftPage() {
    const [activeShifts, shiftHistory, users] = await Promise.all([
        getActiveShifts(),
        getShiftHistory(),
        getUsers(),
    ]);

    return (
        <ShiftClient
            initialActiveShifts={activeShifts}
            initialShiftHistory={shiftHistory}
            users={users}
        />
    );
}
