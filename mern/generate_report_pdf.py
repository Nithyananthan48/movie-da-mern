from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
import textwrap


INPUT_MD = "PROJECT_REPORT.md"
OUTPUT_PDF = "PROJECT_REPORT.pdf"


def write_pdf_from_markdown(md_path: str, pdf_path: str) -> None:
  with open(md_path, "r", encoding="utf-8") as f:
    lines = f.read().splitlines()

  c = canvas.Canvas(pdf_path, pagesize=A4)
  width, height = A4
  margin_x = 2 * cm
  y = height - 2 * cm
  line_h = 14

  def new_page():
    nonlocal y
    c.showPage()
    y = height - 2 * cm

  for raw in lines:
    text = raw.replace("`", "")
    if raw.startswith("# "):
      if y < 3 * cm:
        new_page()
      c.setFont("Helvetica-Bold", 16)
      c.drawString(margin_x, y, text[2:])
      y -= line_h + 4
      continue
    if raw.startswith("## "):
      if y < 3 * cm:
        new_page()
      c.setFont("Helvetica-Bold", 13)
      c.drawString(margin_x, y, text[3:])
      y -= line_h + 2
      continue
    if raw.startswith("### "):
      if y < 3 * cm:
        new_page()
      c.setFont("Helvetica-Bold", 11.5)
      c.drawString(margin_x, y, text[4:])
      y -= line_h
      continue

    c.setFont("Helvetica", 10.5)
    wrapped = textwrap.wrap(text, width=105) if text else [""]
    for w in wrapped:
      if y < 2 * cm:
        new_page()
        c.setFont("Helvetica", 10.5)
      c.drawString(margin_x, y, w)
      y -= line_h

  c.save()


if __name__ == "__main__":
  write_pdf_from_markdown(INPUT_MD, OUTPUT_PDF)
  print(f"Created {OUTPUT_PDF}")
