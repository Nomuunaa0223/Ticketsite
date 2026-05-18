import QRCode from "qrcode";

export async function generateQRSvg(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
