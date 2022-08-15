import { syncData } from '../services/airtable/airtableService';
import { getCheckedInReservationPartials, getReservationAdditional } from '../services/gingr/gingrService';

export async function syncGingrData(): Promise<void> {
    await syncData(getCheckedInReservationPartials, getReservationAdditional)
    console.log("Sync complete")
}
