const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw92_T-sJIj00VgAeou8pNPBm5Tt-P_KY1lIZoY10U8xKDl8TV_ePqZ1I9Xcf4EazKt/exec';

export async function fetchSheetData() {
  const response = await fetch(GOOGLE_SCRIPT_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
}

export async function updateStatus(rowIndex: number, newStatus: 'Open' | 'Reserved') {
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ rowIndex, newStatus }),
  });
  if (!response.ok) {
    throw new Error('Failed to update status');
  }
  return response.json();
}