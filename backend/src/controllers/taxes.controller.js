const supabase = require('../supabaseClient');

// GET tax settings for a hotel
exports.getTaxSettings = async (req, res) => {
  try {
    const hotelId = req.user?.hotel_id || req.body?.hotel_id || req.query?.hotel_id;

    if (!hotelId) {
      return res.status(400).json({ success: false, error: 'Hotel context missing' });
    }

    const { data, error } = await supabase
      .from('hotel_tax_settings')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching tax settings:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // If no settings exist, return defaults
    if (!data) {
      return res.status(200).json({
        success: true,
        data: {
          gst_rate: 18,
          service_charge: 0,
          service_charge_enabled: false,
        },
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in getTaxSettings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// CREATE or UPDATE tax settings for a hotel
exports.saveTaxSettings = async (req, res) => {
  try {
    const hotelId = req.user?.hotel_id || req.body?.hotel_id || req.query?.hotel_id;

    if (!hotelId) {
      return res.status(400).json({ success: false, error: 'Hotel context missing' });
    }
    const { gst_rate, service_charge, service_charge_enabled } = req.body;

    // Validate input
    if (
      gst_rate === undefined ||
      gst_rate === null ||
      service_charge === undefined ||
      service_charge === null ||
      service_charge_enabled === undefined ||
      service_charge_enabled === null
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: gst_rate, service_charge, service_charge_enabled',
      });
    }

    // Validate numeric values
    if (isNaN(gst_rate) || isNaN(service_charge)) {
      return res.status(400).json({
        success: false,
        error: 'gst_rate and service_charge must be numeric values',
      });
    }

    // Validate ranges
    if (gst_rate < 0 || gst_rate > 100) {
      return res.status(400).json({
        success: false,
        error: 'gst_rate must be between 0 and 100',
      });
    }

    if (service_charge < 0 || service_charge > 100) {
      return res.status(400).json({
        success: false,
        error: 'service_charge must be between 0 and 100',
      });
    }

    // First check if settings exist
    const { data: existingData, error: fetchError } = await supabase
      .from('hotel_tax_settings')
      .select('id')
      .eq('hotel_id', hotelId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing tax settings:', fetchError);
      return res.status(500).json({ success: false, error: fetchError.message });
    }

    let result;

    if (existingData) {
      // UPDATE
      result = await supabase
        .from('hotel_tax_settings')
        .update({
          gst_rate,
          service_charge,
          service_charge_enabled
        })
        .eq('hotel_id', hotelId)
        .select()
        .single();
    } else {
      // CREATE
      result = await supabase
        .from('hotel_tax_settings')
        .insert({
          hotel_id: hotelId,
          gst_rate,
          service_charge,
          service_charge_enabled,
        })
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      console.error('Error saving tax settings:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Tax settings saved successfully',
      data,
    });
  } catch (error) {
    console.error('Error in saveTaxSettings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
