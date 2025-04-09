import { randomBytes, createHash } from 'crypto';

/**
 * Generate a unique barcode for a song based on its attributes
 * 
 * @param songTitle The title of the song
 * @param artistName The main artist of the song
 * @param timestamp Current timestamp (optional, defaults to current time)
 * @returns A unique barcode string (format: JV-XXXXXXXX-XXXX)
 */
export function generateSongBarcode(
  songTitle: string, 
  artistName: string, 
  timestamp: number = Date.now()
): string {
  // Create a string to hash based on the song attributes and a random value
  const randomValue = randomBytes(8).toString('hex');
  const stringToHash = `${songTitle}${artistName}${timestamp}${randomValue}`;
  
  // Create a SHA-256 hash
  const hash = createHash('sha256').update(stringToHash).digest('hex');
  
  // Format the barcode as JV-XXXXXXXX-XXXX (JV prefix for JamVault)
  // Take first 8 characters for the main part and next 4 for the suffix
  const barcodePart1 = hash.substring(0, 8).toUpperCase();
  const barcodePart2 = hash.substring(8, 12).toUpperCase();
  
  return `JV-${barcodePart1}-${barcodePart2}`;
}

/**
 * Verify if a barcode follows the JamVault format
 * 
 * @param barcode The barcode to verify
 * @returns Boolean indicating if the barcode is valid
 */
export function isValidBarcode(barcode: string): boolean {
  const barcodeRegex = /^JV-[0-9A-F]{8}-[0-9A-F]{4}$/;
  return barcodeRegex.test(barcode);
}