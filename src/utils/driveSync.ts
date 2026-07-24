import { AppState } from '../types';

const STORAGE_KEY = 'STUDENT_RADAR_APP_STATE_V1';

// 1. Local Auto-Sync (Instant & Constant)
export function saveLocalState(state: AppState): void {
  try {
    const json = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function loadLocalState(): AppState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json) as AppState;
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }
  return null;
}

// 2. Google Drive Backup & Sync Service via REST API
export async function uploadToGoogleDrive(
  accessToken: string,
  state: AppState,
  existingFileId?: string
): Promise<{ fileId: string; fileName: string }> {
  const fileName = 'student_radar_tracking_backup.json';
  const fileContent = JSON.stringify(state, null, 2);

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (existingFileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive upload failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return { fileId: data.id, fileName };
}

// Export state as downloadable JSON file
export function exportStateAsJSON(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `student_radar_data_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Import state from JSON file
export function importStateFromJSON(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AppState;
        if (parsed && Array.isArray(parsed.tabGroups)) {
          resolve(parsed);
        } else {
          reject(new Error('Invalid backup file format. Missing tabGroups.'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
