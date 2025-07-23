import { setItemAsync, getItemAsync, deleteItemAsync } from "expo-secure-store";

export async function saveSecure(key, value) {
  try {
    await setItemAsync(key, value);
  } catch (error) {
    console.error("Error saving to secure store", error);
  }
}

export async function getSecure(key) {
  try {
    return await getItemAsync(key);
  } catch (error) {
    console.error("Error retrieving from secure store", error);
  }
}

export async function deleteSecure(key) {
  try {
    await deleteItemAsync(key);
  } catch (error) {
    console.error("Error deleting from secure store", error);
  }
}
