const supabase = require('../supabaseClient');

// List all stations for a hotel
const listStations = async (req, res) => {
  try {
    const hotelId = req.user.hotel_id;

    const { data, error } = await supabase
      .from('kitchen_stations')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ stations: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new station
const createStation = async (req, res) => {
  try {
    const hotelId = req.user.hotel_id;
    const { name, station_type, printer_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Station name is required' });
    }

    const { data, error } = await supabase
      .from('kitchen_stations')
      .insert([
        {
          hotel_id: hotelId,
          name,
          station_type: station_type || null,
          printer_id: printer_id || null,
          enabled: true
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ station: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a station
const updateStation = async (req, res) => {
  try {
    const hotelId = req.user.hotel_id;
    const stationId = req.params.id;
    const { name, station_type, printer_id, enabled } = req.body;

    // Verify station belongs to this hotel
    const { data: existing, error: fetchError } = await supabase
      .from('kitchen_stations')
      .select('id')
      .eq('id', stationId)
      .eq('hotel_id', hotelId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (station_type !== undefined) updateData.station_type = station_type;
    if (printer_id !== undefined) updateData.printer_id = printer_id;
    if (enabled !== undefined) updateData.enabled = enabled;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('kitchen_stations')
      .update(updateData)
      .eq('id', stationId)
      .eq('hotel_id', hotelId)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ station: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle station enabled/disabled status
const toggleStation = async (req, res) => {
  try {
    const hotelId = req.user.hotel_id;
    const stationId = req.params.id;

    // Fetch current status
    const { data: existing, error: fetchError } = await supabase
      .from('kitchen_stations')
      .select('enabled')
      .eq('id', stationId)
      .eq('hotel_id', hotelId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const { data, error } = await supabase
      .from('kitchen_stations')
      .update({
        enabled: !existing.enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', stationId)
      .eq('hotel_id', hotelId)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ station: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a station
const deleteStation = async (req, res) => {
  try {
    const hotelId = req.user.hotel_id;
    const stationId = req.params.id;

    // Verify station belongs to this hotel
    const { data: existing, error: fetchError } = await supabase
      .from('kitchen_stations')
      .select('id')
      .eq('id', stationId)
      .eq('hotel_id', hotelId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const { error } = await supabase
      .from('kitchen_stations')
      .delete()
      .eq('id', stationId)
      .eq('hotel_id', hotelId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listStations,
  createStation,
  updateStation,
  toggleStation,
  deleteStation
};
