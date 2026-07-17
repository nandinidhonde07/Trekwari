import QRCode from 'qrcode';

/**
 * Generates a QR Code as a base64 Data URL.
 * @param text The text or URL to encode in the QR code
 */
export async function generateQRCode(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      margin: 1,
      color: {
        dark: '#14532D', // Forest Green
        light: '#FFFFFF' // White background
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('QR Code generation failed');
  }
}
