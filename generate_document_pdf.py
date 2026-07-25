from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

OUTPUT_PATH = "document.pdf"

content_lines = [
    "Movie Rating Aggregator - Project Document",
    "",
    "1) Project Overview",
    "- Frontend: React + TypeScript + Vite",
    "- Backend: Node.js + TypeScript + Express + Prisma",
    "- Database: SQLite (local dev) via Prisma",
    "",
    "2) Run Instructions",
    "Step 1: Open terminal in project root: D:\\New folder",
    "Step 2: Install dependencies: npm install",
    "",
    "Step 3: Create backend/.env with:",
    'DATABASE_URL=\"file:./prisma/dev.db\"',
    'JWT_SECRET=\"dev-secret\"',
    "PORT=4000",
    'CLIENT_ORIGIN=\"http://localhost:5173\"',
    "",
    "Step 4: Create frontend/.env with:",
    'VITE_API_BASE_URL=\"http://localhost:4000\"',
    "",
    "Step 5: Prepare database:",
    "npm run prisma:generate --workspace backend",
    "npx prisma db push --schema backend/prisma/schema.prisma",
    "npm run prisma:seed --workspace backend",
    "",
    "Step 6: Start backend:",
    "npm run dev --workspace backend",
    "",
    "Step 7: Start frontend (new terminal):",
    "npm run dev --workspace frontend",
    "",
    "3) URLs",
    "- Frontend: http://localhost:5173",
    "- Backend health: http://localhost:4000/health",
    "",
    "4) Admin Login",
    "- Email: admin@example.com",
    "- Password: admin123",
    "",
    "5) Common Troubleshooting",
    "- If app is stuck on loading: ensure backend terminal is running.",
    "- If login/search fails: verify backend .env and database commands ran.",
    "- If old UI shows: hard refresh browser (Ctrl+F5).",
]


def write_pdf(path: str) -> None:
    c = canvas.Canvas(path, pagesize=A4)
    width, height = A4
    x = 2 * cm
    y = height - 2 * cm
    line_height = 14

    c.setFont("Helvetica-Bold", 14)
    c.drawString(x, y, content_lines[0])
    y -= 20
    c.setFont("Helvetica", 10.5)

    for line in content_lines[1:]:
        if y < 2 * cm:
            c.showPage()
            c.setFont("Helvetica", 10.5)
            y = height - 2 * cm
        c.drawString(x, y, line)
        y -= line_height

    c.save()


if __name__ == "__main__":
    write_pdf(OUTPUT_PATH)
    print(f"Created {OUTPUT_PATH}")
