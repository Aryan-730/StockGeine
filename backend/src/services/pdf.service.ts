import PDFDocument from "pdfkit";
import { Response } from "express";
import { ISale } from "../models/Sale";
import { IBusiness } from "../models/Business";

export function streamReceiptPdf(
  res: Response,
  sale: ISale,
  business: IBusiness,
  customerName?: string
): void {
  const doc = new PDFDocument({ margin: 40, size: "A5" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=receipt-${sale.invoiceNumber}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(18).font("Helvetica-Bold").text(business.name, { align: "center" });
  if (business.address) {
    doc.fontSize(9).font("Helvetica").text(business.address, { align: "center" });
  }
  if (business.phone) {
    doc.fontSize(9).text(business.phone, { align: "center" });
  }
  doc.moveDown(1);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(10).font("Helvetica-Bold").text(`Invoice: ${sale.invoiceNumber}`);
  doc.font("Helvetica").text(`Date: ${new Date(sale.createdAt).toLocaleString()}`);
  if (customerName) {
    doc.text(`Customer: ${customerName}`);
  }
  doc.text(`Payment Method: ${sale.paymentMethod.toUpperCase()}`);
  doc.moveDown(0.8);

  doc.font("Helvetica-Bold");
  const colX = { name: 40, qty: 250, price: 310, total: 390 };
  doc.text("Item", colX.name, doc.y, { continued: false });
  doc.text("Qty", colX.qty, doc.y - doc.currentLineHeight());
  doc.text("Price", colX.price, doc.y - doc.currentLineHeight());
  doc.text("Total", colX.total, doc.y - doc.currentLineHeight());
  doc.moveDown(0.3);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.3);

  doc.font("Helvetica");
  for (const item of sale.items) {
    const y = doc.y;
    doc.text(item.name, colX.name, y, { width: 200 });
    doc.text(String(item.quantity), colX.qty, y);
    doc.text(item.unitPrice.toFixed(2), colX.price, y);
    doc.text(item.subtotal.toFixed(2), colX.total, y);
    doc.moveDown(0.4);
  }

  doc.moveDown(0.3);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.4);

  doc.text(`Subtotal: ${sale.subtotal.toFixed(2)}`, { align: "right" });
  doc.text(`Discount: -${sale.discount.toFixed(2)}`, { align: "right" });
  doc.text(`Tax: +${sale.tax.toFixed(2)}`, { align: "right" });
  doc.font("Helvetica-Bold").fontSize(12).text(`Total: ${sale.total.toFixed(2)}`, {
    align: "right",
  });

  doc.moveDown(1.5);
  doc.fontSize(9).font("Helvetica-Oblique").text("Thank you for your business!", {
    align: "center",
  });

  doc.end();
}
