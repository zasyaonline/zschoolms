import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * PDF Generation Service
 * Generates report card PDFs with marks, grades, and signature placeholders
 */

// PDF storage paths
const PDF_DIR = process.env.PDF_DIR || path.join(process.cwd(), 'uploads', 'report-cards');

/**
 * Ensure PDF directory exists
 */
const ensurePdfDir = () => {
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
    logger.info(`Created PDF directory: ${PDF_DIR}`);
  }
};

/**
 * Generate a report card PDF
 * @param {Object} reportData - Report card data
 * @returns {Promise<Object>} PDF generation result with path and hash
 */
export const generateReportCardPDF = async (reportData) => {
  ensurePdfDir();

  const {
    student,
    academicYear,
    school,
    subjects = [],
    totalMarksObtained,
    totalMaxMarks,
    percentage,
    finalGrade,
    reportCardId,
    signatureData = null
  } = reportData;

  const fileName = `report-card-${student.studentId}-${academicYear.year || 'current'}-${Date.now()}.pdf`;
  const filePath = path.join(PDF_DIR, fileName);

  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Report Card - ${student.firstName} ${student.lastName}`,
          Author: school?.name || 'ZSchool',
          Subject: 'Academic Report Card',
          Creator: 'ZSchool Management System',
          Producer: 'PDFKit',
          CreationDate: new Date()
        }
      });

      // Create write stream
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // ============= HEADER =============
      // School Logo placeholder
      doc.rect(50, 50, 60, 60).stroke('#1F55A6');
      doc.fontSize(8).fillColor('#666').text('LOGO', 65, 75);

      // School Name and Details
      doc.fontSize(20)
        .fillColor('#1F55A6')
        .text(school?.name || 'ZSchool', 130, 55, { width: 400 });
      
      doc.fontSize(10)
        .fillColor('#333')
        .text(school?.address || 'School Address', 130, 80);
      
      doc.fontSize(10)
        .text(`Phone: ${school?.phone || 'N/A'} | Email: ${school?.email || 'N/A'}`, 130, 95);

      // Report Card Title
      doc.moveDown(2);
      doc.fontSize(16)
        .fillColor('#1F55A6')
        .text('ACADEMIC REPORT CARD', { align: 'center' });

      doc.fontSize(12)
        .fillColor('#666')
        .text(`Academic Year: ${academicYear?.name || academicYear?.year || 'Current'}`, { align: 'center' });

      // Horizontal line
      doc.moveDown(0.5);
      doc.strokeColor('#1F55A6')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      // ============= STUDENT INFO =============
      doc.moveDown(1);
      const infoStartY = doc.y;

      // Left column
      doc.fontSize(10).fillColor('#333');
      doc.text('Student Name:', 50, infoStartY, { continued: true })
        .font('Helvetica-Bold')
        .text(` ${student.firstName} ${student.lastName}`);
      doc.font('Helvetica');

      doc.text('Student ID:', 50, infoStartY + 20, { continued: true })
        .font('Helvetica-Bold')
        .text(` ${student.studentId || 'N/A'}`);
      doc.font('Helvetica');

      doc.text('Class:', 50, infoStartY + 40, { continued: true })
        .font('Helvetica-Bold')
        .text(` ${student.class || 'N/A'}`);
      doc.font('Helvetica');

      // Right column
      doc.text('Date of Birth:', 300, infoStartY, { continued: true })
        .font('Helvetica-Bold')
        .text(` ${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}`);
      doc.font('Helvetica');

      doc.text('Roll No:', 300, infoStartY + 20, { continued: true })
        .font('Helvetica-Bold')
        .text(` ${student.rollNo || 'N/A'}`);
      doc.font('Helvetica');

      doc.text('Section:', 300, infoStartY + 40, { continued: true })
        .font('Helvetica-Bold')
        .text(` ${student.section || 'N/A'}`);
      doc.font('Helvetica');

      // ============= MARKS TABLE =============
      doc.moveDown(3);
      
      // Table header
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [30, 180, 80, 80, 80, 45];

      // Header background
      doc.rect(tableLeft, tableTop, 495, 25).fill('#1F55A6');

      // Header text
      doc.fillColor('#fff').fontSize(10);
      doc.text('S.No', tableLeft + 5, tableTop + 8);
      doc.text('Subject', tableLeft + 35, tableTop + 8);
      doc.text('Max Marks', tableLeft + 220, tableTop + 8);
      doc.text('Obtained', tableLeft + 305, tableTop + 8);
      doc.text('Percentage', tableLeft + 385, tableTop + 8);
      doc.text('Grade', tableLeft + 460, tableTop + 8);

      // Table rows
      doc.fillColor('#333');
      let rowY = tableTop + 30;

      if (subjects.length > 0) {
        subjects.forEach((subject, index) => {
          const isEven = index % 2 === 0;
          
          // Row background
          if (isEven) {
            doc.rect(tableLeft, rowY - 5, 495, 22).fill('#f5f5f5');
          }

          doc.fillColor('#333');
          doc.text(`${index + 1}`, tableLeft + 5, rowY);
          doc.text(subject.name || subject.subjectName || 'N/A', tableLeft + 35, rowY);
          doc.text(`${subject.maxMarks || 100}`, tableLeft + 230, rowY);
          doc.text(`${subject.marksObtained || 0}`, tableLeft + 315, rowY);
          
          const subjectPercentage = subject.maxMarks > 0 
            ? ((subject.marksObtained / subject.maxMarks) * 100).toFixed(1)
            : '0.0';
          doc.text(`${subjectPercentage}%`, tableLeft + 395, rowY);
          doc.text(calculateGrade(parseFloat(subjectPercentage)), tableLeft + 465, rowY);

          rowY += 22;
        });
      } else {
        // No subjects - show placeholder
        doc.text('No subjects data available', tableLeft + 200, rowY);
        rowY += 22;
      }

      // Table border
      doc.strokeColor('#ddd').lineWidth(1);
      doc.rect(tableLeft, tableTop, 495, rowY - tableTop + 5).stroke();

      // ============= TOTALS =============
      doc.moveDown(1);
      const totalsY = rowY + 15;

      // Totals box
      doc.rect(300, totalsY, 245, 80).fill('#E8F4FC').stroke('#1F55A6');

      doc.fontSize(11).fillColor('#333');
      doc.text('SUMMARY', 320, totalsY + 10);
      
      doc.fontSize(10);
      doc.text(`Total Marks Obtained: ${totalMarksObtained || 0} / ${totalMaxMarks || 0}`, 320, totalsY + 30);
      doc.text(`Overall Percentage: ${percentage || 0}%`, 320, totalsY + 48);
      
      doc.font('Helvetica-Bold').fontSize(12);
      doc.fillColor('#1F55A6').text(`Final Grade: ${finalGrade || 'N/A'}`, 320, totalsY + 66);
      doc.font('Helvetica');

      // Grade scale reference
      doc.fontSize(8).fillColor('#666');
      doc.text('Grade Scale: A+ (90-100) | A (80-89) | B+ (70-79) | B (60-69) | C (50-59) | D (40-49) | F (<40)', 
        50, totalsY + 30);

      // ============= SIGNATURE SECTION =============
      const signatureY = totalsY + 120;

      // Signature boxes
      doc.fontSize(10).fillColor('#333');

      // Class Teacher
      doc.rect(50, signatureY, 150, 60).stroke('#ccc');
      doc.text('Class Teacher', 90, signatureY + 45);
      doc.fontSize(8).fillColor('#666').text('Signature & Date', 85, signatureY + 57);

      // Principal Signature
      doc.rect(200, signatureY, 150, 60).stroke('#1F55A6').lineWidth(2);
      if (signatureData) {
        doc.fontSize(8).fillColor('#1F55A6');
        doc.text('✓ DIGITALLY SIGNED', 225, signatureY + 10);
        doc.text(`Signed: ${new Date(signatureData.signedAt).toLocaleDateString()}`, 225, signatureY + 22);
        doc.text(`Cert: ${signatureData.certificateFingerprint?.substring(0, 16)}...`, 210, signatureY + 34);
      }
      doc.fontSize(10).fillColor('#333').text('Principal', 250, signatureY + 45);
      doc.fontSize(8).fillColor('#666').text('Digital Signature', 235, signatureY + 57);

      // Parent/Guardian
      doc.rect(370, signatureY, 150, 60).stroke('#ccc');
      doc.fontSize(10).fillColor('#333').text('Parent/Guardian', 400, signatureY + 45);
      doc.fontSize(8).fillColor('#666').text('Signature & Date', 395, signatureY + 57);

      // ============= FOOTER =============
      doc.fontSize(8).fillColor('#666');
      doc.text(
        'This is a computer-generated report card. Digital signature ensures authenticity.',
        50,
        750,
        { align: 'center' }
      );
      doc.text(
        `Generated on: ${new Date().toLocaleString()} | Report ID: ${reportCardId || 'N/A'}`,
        50,
        762,
        { align: 'center' }
      );

      // QR Code placeholder for verification
      doc.rect(490, 720, 50, 50).stroke('#ccc');
      doc.fontSize(6).text('QR', 508, 742);

      // Finalize PDF
      doc.end();

      // Wait for write to complete
      writeStream.on('finish', () => {
        // Calculate hash of generated PDF
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

        logger.info(`Report card PDF generated: ${fileName}`);

        resolve({
          success: true,
          filePath,
          fileName,
          relativePath: `/uploads/report-cards/${fileName}`,
          pdfHash,
          size: fs.statSync(filePath).size
        });
      });

      writeStream.on('error', (error) => {
        logger.error('Error writing PDF:', error);
        reject(error);
      });

    } catch (error) {
      logger.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

/**
 * Calculate grade from percentage
 * @param {number} percentage 
 * @returns {string} Grade
 */
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

/**
 * Delete a generated PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {boolean} Success status
 */
export const deletePDF = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted PDF: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting PDF:', error);
    return false;
  }
};

/**
 * Get PDF file as buffer
 * @param {string} filePath - Path to PDF file
 * @returns {Buffer|null} PDF buffer
 */
export const getPDFBuffer = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  } catch (error) {
    logger.error('Error reading PDF:', error);
    return null;
  }
};

export default {
  generateReportCardPDF,
  deletePDF,
  getPDFBuffer
};
