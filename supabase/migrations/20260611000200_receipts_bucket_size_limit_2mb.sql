-- Receipts embed brand images as base64 data URIs (~750 KB HTML); 512 KB limit rejected every upload
UPDATE storage.buckets SET file_size_limit = 2097152 WHERE id = 'receipts';
