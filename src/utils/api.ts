export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!contentType.includes('application/json')) {
    const snippet = text.trim().slice(0, 100);
    throw new Error(
      `เซิร์ฟเวอร์ไม่ได้ตอบกลับเป็น JSON (HTTP ${res.status}${snippet ? `: ${snippet}` : ''}) — หากใช้งานบน Vercel กรุณาตรวจสอบว่าได้ deploy ฟังก์ชัน /api และตั้งค่า Environment Variables แล้ว`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`ไม่สามารถอ่านข้อมูล JSON จากเซิร์ฟเวอร์ได้ (HTTP ${res.status})`);
  }
}
