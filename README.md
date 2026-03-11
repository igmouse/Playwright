# Playwright API (Node.js)

โปรเจกต์นี้คือ REST API ที่สร้างด้วย **Node.js + Express + Playwright** สำหรับงานอัตโนมัติบนเว็บ เช่น:
- ตรวจสุขภาพ service (`/health`)
- ดึงชื่อหน้าเว็บ (`/v1/page-title`)
- ถ่าย screenshot (`/v1/screenshot`)
- ดึงข้อมูลพื้นฐานจากหน้าเว็บ (`/v1/extract`)

## 1) ติดตั้ง

```bash
npm install
npx playwright install chromium
```

> ถ้ารันใน container/server บางสภาพแวดล้อม อาจต้องใช้ `npx playwright install --with-deps chromium`

## 2) ตั้งค่า Environment

คัดลอกไฟล์ตัวอย่าง:

```bash
cp .env.example .env
```

ตัวแปรที่รองรับ:
- `PORT` พอร์ตของ API (ค่าเริ่มต้น `3000`)
- `PW_TIMEOUT_MS` timeout ตอนเปิดหน้าเว็บ (ค่าเริ่มต้น `30000` ms)

## 3) รัน API

```bash
npm run start
```

หรือแบบ dev mode:

```bash
npm run dev
```

## 4) API Endpoints

### GET `/health`
เช็กว่า service พร้อมใช้งานหรือไม่

**Response**
```json
{
  "ok": true,
  "service": "playwright-api"
}
```

---

### POST `/v1/page-title`
รับ URL แล้วคืนค่า title

**Request Body**
```json
{ "url": "https://example.com" }
```

**Response**
```json
{
  "url": "https://example.com",
  "title": "Example Domain"
}
```

---

### POST `/v1/screenshot`
รับ URL แล้วส่งไฟล์ `screenshot.png` กลับ

**Request Body**
```json
{ "url": "https://example.com" }
```

> Endpoint นี้ตอบกลับเป็นไฟล์ภาพ (binary)

---

### POST `/v1/extract`
รับ URL แล้วดึงข้อมูลพื้นฐานจากหน้าเว็บ

**Request Body**
```json
{ "url": "https://example.com" }
```

**Response ตัวอย่าง**
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "firstH1": "Example Domain",
  "links": [
    {
      "text": "More information...",
      "href": "https://www.iana.org/domains/example"
    }
  ]
}
```

## 5) ตัวอย่างเรียกผ่าน cURL

### 5.1 Health
```bash
curl http://localhost:3000/health
```

### 5.2 Page title
```bash
curl -X POST http://localhost:3000/v1/page-title \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### 5.3 Screenshot
```bash
curl -X POST http://localhost:3000/v1/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  --output screenshot.png
```

### 5.4 Extract
```bash
curl -X POST http://localhost:3000/v1/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## 6) หมายเหตุสำคัญ (Production)

- ควรเพิ่ม authentication/authorization ก่อนเปิดใช้งานจริง
- ควรทำ rate limit และ queue ป้องกัน workload สูง
- ควรมี allowlist ของ domain ที่เรียกได้
- ระวัง SSRF และ request ไปยัง internal network
