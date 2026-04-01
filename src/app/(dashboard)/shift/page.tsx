import { enforceRouteAccess } from '@/lib/actions/permissions';
import { getActiveShifts, getShiftHistory } from "@/lib/actions/shifts";
import ShiftClient from "./shift-client";

export default async function ShiftPage() {
  await enforceRouteAccess('/shift');

  const [activeShifts, shiftHistoryResult] = await Promise.all([
    getActiveShifts(),
    getShiftHistory(1, 20),
  ]);

  return (
    <ShiftClient
      initialActiveShifts={activeShifts}
      initialShiftHistory={shiftHistoryResult.data}
      totalShifts={shiftHistoryResult.total}
    />
  );
}
