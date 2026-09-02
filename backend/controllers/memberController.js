import Member from '../models/Member.js'

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// @desc    Get all members (with optional search)
// @route   GET /api/members
// @access  Private (Admin only)
export const getMembers = async (req, res) => {
  try {
    const { search } = req.query
    const query = {}
    if (search) {
      const searchRe = escapeRegex(search)
      query.$or = [
        { name: { $regex: searchRe, $options: 'i' } },
        { phone: { $regex: searchRe, $options: 'i' } },
        { email: { $regex: searchRe, $options: 'i' } }
      ]
    }

    const members = await Member.find(query).sort({ name: 1 })

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    })
  } catch (error) {
    console.error('Get members error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching members' })
  }
}

// @desc    Create a member
// @route   POST /api/members
// @access  Private (Admin only)
export const createMember = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' })
    }

    const member = await Member.create({
      name: name.trim(),
      phone: phone || '',
      email: email || '',
      address: address || '',
      notes: notes || '',
      createdBy: req.user.id
    })

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: member
    })
  } catch (error) {
    console.error('Create member error:', error)
    res.status(500).json({ success: false, message: 'Server error while creating member' })
  }
}

// @desc    Bulk-create members from a pasted list
// @route   POST /api/members/bulk
// @access  Private (Admin only)
export const bulkCreateMembers = async (req, res) => {
  try {
    const { members } = req.body

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a non-empty list of members' })
    }

    const toInsert = members
      .filter(m => m && m.name && m.name.trim())
      .map(m => ({
        name: m.name.trim(),
        phone: (m.phone || '').trim(),
        email: (m.email || '').trim(),
        address: (m.address || '').trim(),
        createdBy: req.user.id
      }))

    if (toInsert.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid member names found in the list' })
    }

    const created = await Member.insertMany(toInsert, { ordered: false })

    res.status(201).json({
      success: true,
      message: `${created.length} member(s) added successfully`,
      count: created.length,
      data: created
    })
  } catch (error) {
    console.error('Bulk create members error:', error)
    res.status(500).json({ success: false, message: 'Server error while bulk-creating members' })
  }
}

// @desc    Update a member
// @route   PUT /api/members/:id
// @access  Private (Admin only)
export const updateMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' })
    }

    const allowedUpdates = ['name', 'phone', 'email', 'address', 'notes', 'isActive']
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        member[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]
      }
    })

    await member.save()

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: member
    })
  } catch (error) {
    console.error('Update member error:', error)
    res.status(500).json({ success: false, message: 'Server error while updating member' })
  }
}

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Private (Admin only)
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' })
    }

    await Member.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully'
    })
  } catch (error) {
    console.error('Delete member error:', error)
    res.status(500).json({ success: false, message: 'Server error while deleting member' })
  }
}
