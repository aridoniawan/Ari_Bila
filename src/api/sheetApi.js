import { API_URL } from '../config';

// Cache in memory
let appDataCache = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchAllAppData = async (forceRefresh = false) => {
  // If no URL, return empty object (handled in component)
  if (!API_URL || API_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
    return {
      "Vendor All-in": [],
      "Vendor Custom": [],
      "To-Do List": [],
      "Tamu": [],
      "Riwayat Tabungan": [],
      "Pengaturan": [],
      "Seserahan": []
    };
  }

  if (!forceRefresh && appDataCache) {
    return appDataCache;
  }

  try {
    const response = await fetch(`${API_URL}?action=fetchAll&t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error("Gagal mengambil data");
    const data = await response.json();
    appDataCache = data;
    return data;
  } catch (error) {
    console.error("Fetch all error:", error);
    // Fallback if fetchAll endpoint doesn't exist yet in user's script
    return null; 
  }
};

export const fetchSheetData = async (sheetName) => {
  // Try to use cache first
  if (appDataCache && appDataCache[sheetName]) {
    return appDataCache[sheetName];
  }

  try {
    const response = await fetch(`${API_URL}?sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error("Gagal mengambil data");
    const data = await response.json();
    
    // Update specific cache
    if (!appDataCache) appDataCache = {};
    appDataCache[sheetName] = Array.isArray(data) ? data : [];
    
    return appDataCache[sheetName];
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const addSheetData = async (sheetName, dataRow) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "add",
        sheet: sheetName,
        data: { ...dataRow, ID: Date.now().toString() }
      })
    });
    // Invalidate cache
    appDataCache = null;
    return await response.json();
  } catch (error) {
    console.error("Add error:", error);
    throw error;
  }
};

export const updateSheetData = async (sheetName, dataRow) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "update",
        sheet: sheetName,
        data: dataRow
      })
    });
    // Invalidate cache
    appDataCache = null;
    return await response.json();
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
};

export const deleteSheetData = async (sheetName, id) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "delete",
        sheet: sheetName,
        data: { ID: id }
      })
    });
    // Invalidate cache
    appDataCache = null;
    return await response.json();
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
};
