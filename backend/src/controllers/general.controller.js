const supabase = require('../supabaseClient');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// GET general settings for a hotel
exports.getGeneralSettings = async (req, res) => {
  try {
    const hotelId = req.user?.hotel_id || req.body?.hotel_id || req.query?.hotel_id;

    if (!hotelId) {
      return res.status(400).json({ success: false, error: 'Hotel context missing' });
    }

    // Select all columns to avoid schema mismatch if some columns were not migrated
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .single();

    if (error) {
      console.error('Error fetching general settings:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    // Normalize response to expected fields
    const normalized = {
      id: data.id,
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      currency: data.currency || 'INR',
      timezone: data.timezone || 'Asia/Kolkata',
      owner_name: data.owner_name || '',
      owner_phone: data.owner_phone || '',
      owner_email: data.owner_email || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      logo_url: data.logo_url || ''
    };

    return res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    console.error('Error in getGeneralSettings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE general settings for a hotel
exports.updateGeneralSettings = async (req, res) => {
  try {
    const hotelId = req.user?.hotel_id || req.body?.hotel_id || req.query?.hotel_id;

    if (!hotelId) {
      return res.status(400).json({ success: false, error: 'Hotel context missing' });
    }
    const {
      name,
      address,
      phone,
      email,
      currency,
      timezone,
      owner_name,
      owner_phone,
      owner_email,
      city,
      state,
      pincode
    } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant name and email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate phone format (basic validation)
    if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone format'
      });
    }

    // Build update object
    const updateData = {
      name: name.trim(),
      address: address ? address.trim() : null,
      phone: phone ? phone.trim() : null,
      email: email.trim(),
      currency: currency || 'INR',
      timezone: timezone || 'Asia/Kolkata',
      owner_name: owner_name ? owner_name.trim() : null,
      owner_phone: owner_phone ? owner_phone.trim() : null,
      owner_email: owner_email ? owner_email.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      pincode: pincode ? pincode.trim() : null
    };

    // Fetch existing hotel row to discover which columns actually exist in the DB
    const { data: existingHotel, error: fetchErr } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching hotel before update:', fetchErr);
      return res.status(500).json({ success: false, error: fetchErr.message });
    }

    if (!existingHotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    // Only include keys that exist in the current hotel row to avoid PostgREST schema cache errors
    const allowedKeys = new Set(Object.keys(existingHotel));
    const filteredUpdate = {};
    Object.keys(updateData).forEach(k => {
      if (allowedKeys.has(k)) filteredUpdate[k] = updateData[k];
    });

    if (Object.keys(filteredUpdate).length === 0) {
      // Nothing to update because DB schema does not have these columns
      return res.status(400).json({ success: false, error: 'No valid fields to update in database schema' });
    }

    // Update the hotel with filtered fields
    const { data, error } = await supabase
      .from('hotels')
      .update(filteredUpdate)
      .eq('id', hotelId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating general settings:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'General settings updated successfully',
      data
    });
  } catch (error) {
    console.error('Error in updateGeneralSettings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPLOAD hotel logo
exports.uploadLogo = async (req, res) => {
  try {
    const hotelId = req.user?.hotel_id || req.body?.hotel_id || req.query?.hotel_id;

    if (!hotelId) {
      // delete temporary upload if present
      if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Hotel context missing' });
    }

    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided. Please upload a logo image.'
      });
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path); // Delete uploaded file
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only JPG, PNG, WebP, and SVG are allowed.'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path); // Delete uploaded file
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 5MB limit.'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname);
    const filename = `hotel-${hotelId}-${timestamp}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Move file to permanent location
    fs.renameSync(req.file.path, filepath);

    // Update logo_url in database
    const logoUrl = `/uploads/logos/${filename}`;

    // Ensure hotels table has logo_url column before updating
    const { data: existingHotel, error: fetchErr } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching hotel before logo update:', fetchErr);
      fs.unlinkSync(filepath);
      return res.status(500).json({ success: false, error: fetchErr.message });
    }

    if (!existingHotel) {
      fs.unlinkSync(filepath);
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    if (!Object.prototype.hasOwnProperty.call(existingHotel, 'logo_url')) {
      // Database schema doesn't have logo_url column
      fs.unlinkSync(filepath);
      return res.status(400).json({ success: false, error: "Database schema missing 'logo_url' column" });
    }

    const { data, error } = await supabase
      .from('hotels')
      .update({ logo_url: logoUrl })
      .eq('id', hotelId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating logo_url in database:', error);
      fs.unlinkSync(filepath); // Delete uploaded file
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logo_url: logoUrl,
        filename: filename
      }
    });
  } catch (error) {
    console.error('Error in uploadLogo:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE hotel logo
exports.deleteLogo = async (req, res) => {
  try {
    const hotelId = req.user?.hotel_id || req.body?.hotel_id || req.query?.hotel_id;

    if (!hotelId) {
      return res.status(400).json({ success: false, error: 'Hotel context missing' });
    }

    // Get current logo URL
    const { data: hotelData, error: fetchError } = await supabase
      .from('hotels')
      .select('logo_url')
      .eq('id', hotelId)
      .single();

    if (fetchError) {
      console.error('Error fetching hotel:', fetchError);
      return res.status(500).json({ success: false, error: fetchError.message });
    }

    // Delete file from storage if it exists
    if (hotelData?.logo_url) {
      const filename = hotelData.logo_url.split('/').pop();
      const filepath = path.join(uploadsDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Update database to remove logo_url
    const { data, error } = await supabase
      .from('hotels')
      .update({
        logo_url: null
      })
      .eq('id', hotelId)
      .select('*')
      .single();

    if (error) {
      console.error('Error deleting logo:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Logo deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteLogo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
