import { getActiveShifts, getShiftHistory } from "@/lib/actions/shifts";
import { getUsers } from "@/lib/actions/settings";
import ShiftClient from "./shift-client";

export default async function ShiftPage() {
    const [activeShifts, shiftHistoryResult, users] = await Promise.all([
        getActiveShifts(),
        getShiftHistory(1, 20),
        getUsers(),
    ]);

    return (
        <ShiftClient
            initialActiveShifts={activeShifts}
            initialShiftHistory={shiftHistoryResult.data}
            totalShifts={shiftHistoryResult.total}
            users={users}
        />
    );
}
