const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Forex = require('../models/crmModel');

// Use a stable uploads directory (absolute path) and ensure it exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // sanitize original name and avoid directory traversal
        const base = path.basename(file.originalname);
        const safe = Date.now() + '-' + base.replace(/\s+/g, '_');
        cb(null, safe);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const mime = (file.mimetype || '').toLowerCase();
        // Accept common CSV mime-types and .csv extension (case-insensitive)
        if (mime === 'text/csv' || mime === 'application/vnd.ms-excel' || ext === '.csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload and process CSV
exports.uploadCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a CSV file' });
        }

        const results = [];
        const errors = [];
        let successCount = 0;
        let errorCount = 0;

        // Read and parse CSV file
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', async () => {
                try {
                    // Process each row
                    for (let i = 0; i < results.length; i++) {
                        const row = results[i];

                        try {
                            // Map CSV columns to model fields
                            const forexData = {
                                Company_name: row.Company_name || row['Company_name'] || '',
                                Business_vol_Lakh_Per_Year: row.Business_vol_Lakh_Per_Year || row['Business Volume'] || '',
                                Address: row.Address || '',
                                City: row.City || '',
                                State: row.State || '',
                                Country: row.Country || '',
                                Mobile_no: row.Mobile_no || row['Mobile Number'] || '',
                                Landline_no: row.Landline_no || row['Landline Number'] || '',
                                E_mail_id: row.E_mail_id || row['Email'] || '',
                                status: row.status || 'demo', // default status
                                business_type: row.business_type || row['Business Type'] || '',
                                contact_person: row.contact_person || row['Contact Person'] || '',
                                source: row.source || '',
                                assignedTo: row.assignedTo || row['Assigned To'] || null,
                                updatedAt: new Date()
                            };

                            // Validate required fields
                            if (!forexData.Company_name || !forexData.Mobile_no) {
                                errors.push(`Row ${i + 1}: Missing required fields (Company_name or Mobile number)`);
                                errorCount++;
                                continue;
                            }

                            // Check for duplicate mobile number
                            const existing = await Forex.findOne({ Mobile_no: forexData.Mobile_no });
                            if (existing) {
                                errors.push(`Row ${i + 1}: Mobile number ${forexData.Mobile_no} already exists`);
                                errorCount++;
                                continue;
                            }

                            // Save to database
                            await Forex.create(forexData);
                            successCount++;

                        } catch (error) {
                            errors.push(`Row ${i + 1}: ${error.message}`);
                            errorCount++;
                        }
                    }

                    // Clean up uploaded file (best-effort)
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (e) {
                        console.error('Failed to remove uploaded file:', e.message);
                    }

                    res.json({
                        message: 'CSV upload completed',
                        totalRows: results.length,
                        successCount,
                        errorCount,
                        errors: errors.length > 0 ? errors : undefined
                    });

                } catch (error) {
                    // Clean up uploaded file on error
                    try {
                        if (fs.existsSync(req.file.path)) {
                            fs.unlinkSync(req.file.path);
                        }
                    } catch (e) {
                        console.error('Failed to remove uploaded file after error:', e.message);
                    }
                    res.status(500).json({ message: 'Error processing CSV file', error: error.message });
                }
            })
            .on('error', (error) => {
                // Clean up uploaded file on error (best-effort)
                try {
                    if (req.file && fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                } catch (e) {
                    console.error('Failed to remove uploaded file after read error:', e.message);
                }
                res.status(500).json({ message: 'Error reading CSV file', error: error.message });
            });

    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};

// Export multer upload for route
exports.upload = upload.single('csvFile'); 