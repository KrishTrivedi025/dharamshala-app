import Settings from '../models/Settings.js'

// @desc    Get all settings (public ones available to authenticated users)
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    // Always ensure the default annualRitualFee exists
    const fee = await Settings.get('annualRitualFee', 1200)
    const feeDoc = await Settings.findOne({ key: 'annualRitualFee' })
    if (!feeDoc) {
      await Settings.set('annualRitualFee', 1200, null, 'Annual Ritual Payment Fee (Pooja Shulk)')
    }

    const allSettings = await Settings.find({}).sort({ key: 1 })
    res.status(200).json({
      success: true,
      data: {
        annualRitualFee: fee,
        all: allSettings
      }
    })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching settings' })
  }
}

// @desc    Update a setting (admin only)
// @route   PUT /api/settings
// @access  Private (Admin)
export const updateSettings = async (req, res) => {
  try {
    const { key, value, description } = req.body

    if (!key || value === undefined || value === null) {
      return res.status(400).json({ success: false, message: 'Key and value are required' })
    }

    const setting = await Settings.set(key, value, req.user.id, description || '')

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ success: false, message: 'Server error while updating setting' })
  }
}

// @desc    Get annual ritual fee only (public endpoint for users)
// @route   GET /api/settings/ritual-fee
// @access  Private
export const getRitualFee = async (req, res) => {
  try {
    const fee = await Settings.get('annualRitualFee', 1200)
    res.status(200).json({
      success: true,
      data: { annualRitualFee: fee }
    })
  } catch (error) {
    console.error('Get ritual fee error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching ritual fee' })
  }
}
