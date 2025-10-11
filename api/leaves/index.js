import { connectToDatabase } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { validateObjectId, validateLeaveType, validateLeaveStatus, validateDateRange } from '../lib/validators.js';

// Calculate working days between two dates
function calculateWorkingDays(startDate, endDate, workingDays = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false
}) {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    
    if (workingDays[dayName]) {
      count++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// GET /api/leaves - List leaves
async function handleGetLeaves(req, res) {
  try {
    const { db } = await connectToDatabase();
    const leavesCollection = db.collection('leaves');
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');

    let query = {};

    // Filter by role
    if (req.user.role === 'user') {
      // Users can only see their own leaves
      query.userId = req.user.id;
    } else if (req.user.role === 'leader') {
      // Leaders can see leaves from their team
      const team = await teamsCollection.findOne({ leaderId: req.user.id });
      if (team) {
        query.teamId = team._id;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Leader not assigned to any team'
        });
      }
    }
    // Admins can see all leaves (no additional filter)

    const leaves = await leavesCollection.find(query).sort({ createdAt: -1 }).toArray();

    res.status(200).json({
      success: true,
      data: { leaves }
    });

  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// POST /api/leaves - Create leave request
async function handleCreateLeave(req, res) {
  try {
    const { startDate, endDate, reason, type } = req.body;

    // Validate input
    const dateRangeValidation = validateDateRange(startDate, endDate);
    if (!dateRangeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: dateRangeValidation.error
      });
    }

    const typeValidation = validateLeaveType(type);
    if (!typeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: typeValidation.error
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required'
      });
    }

    const { db } = await connectToDatabase();
    const leavesCollection = db.collection('leaves');
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');

    // Get user details
    const user = await usersCollection.findOne({ _id: req.user.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get team settings for working days calculation
    let workingDays = {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    };

    if (user.teamId) {
      const team = await teamsCollection.findOne({ _id: user.teamId });
      if (team?.settings?.workingDays) {
        workingDays = team.settings.workingDays;
      }
    }

    // Calculate working days
    const workingDaysCount = calculateWorkingDays(
      dateRangeValidation.value.startDate,
      dateRangeValidation.value.endDate,
      workingDays
    );

    // Check for overlapping leave requests
    const overlappingLeaves = await leavesCollection.find({
      userId: req.user.id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: dateRangeValidation.value.endDate },
          endDate: { $gte: dateRangeValidation.value.startDate }
        }
      ]
    }).toArray();

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You already have a leave request for this period'
      });
    }

    // Create leave request
    const newLeave = {
      userId: req.user.id,
      employeeName: user.name,
      startDate: dateRangeValidation.value.startDate,
      endDate: dateRangeValidation.value.endDate,
      reason: reason.trim(),
      type: typeValidation.value,
      status: 'pending',
      workingDays: workingDaysCount,
      teamId: user.teamId,
      createdAt: new Date()
    };

    const result = await leavesCollection.insertOne(newLeave);

    res.status(201).json({
      success: true,
      data: {
        leave: {
          _id: result.insertedId.toString(),
          ...newLeave,
          userId: newLeave.userId.toString(),
          teamId: newLeave.teamId?.toString()
        }
      }
    });

  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// PUT /api/leaves/:id - Update leave status
async function handleUpdateLeave(req, res) {
  try {
    const { id } = req.query;
    const { status } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leave ID'
      });
    }

    const statusValidation = validateLeaveStatus(status);
    if (!statusValidation.valid) {
      return res.status(400).json({
        success: false,
        error: statusValidation.error
      });
    }

    const { db } = await connectToDatabase();
    const leavesCollection = db.collection('leaves');
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');

    // Check if leave exists
    const leave = await leavesCollection.findOne({ _id: idValidation.value });
    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave request not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user') {
      // Users can only update their own leaves (and only to cancel)
      if (leave.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Can only update your own leave requests'
        });
      }
      if (statusValidation.value !== 'rejected') {
        return res.status(403).json({
          success: false,
          error: 'Users can only cancel their own leave requests'
        });
      }
    } else if (req.user.role === 'leader') {
      // Leaders can approve/reject leaves from their team
      const team = await teamsCollection.findOne({ leaderId: req.user.id });
      if (!team || leave.teamId?.toString() !== team._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Can only update leaves from your team'
        });
      }
    }
    // Admins can update any leave

    // Update leave status
    await leavesCollection.updateOne(
      { _id: idValidation.value },
      { 
        $set: { 
          status: statusValidation.value,
          updatedAt: new Date(),
          updatedBy: req.user.id
        } 
      }
    );

    // Get updated leave
    const updatedLeave = await leavesCollection.findOne({ _id: idValidation.value });

    res.status(200).json({
      success: true,
      data: {
        leave: {
          _id: updatedLeave._id.toString(),
          userId: updatedLeave.userId.toString(),
          employeeName: updatedLeave.employeeName,
          startDate: updatedLeave.startDate,
          endDate: updatedLeave.endDate,
          reason: updatedLeave.reason,
          type: updatedLeave.type,
          status: updatedLeave.status,
          workingDays: updatedLeave.workingDays,
          teamId: updatedLeave.teamId?.toString(),
          createdAt: updatedLeave.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// DELETE /api/leaves/:id - Delete leave request
async function handleDeleteLeave(req, res) {
  try {
    const { id } = req.query;

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leave ID'
      });
    }

    const { db } = await connectToDatabase();
    const leavesCollection = db.collection('leaves');

    // Check if leave exists
    const leave = await leavesCollection.findOne({ _id: idValidation.value });
    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave request not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user') {
      // Users can only delete their own leaves
      if (leave.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Can only delete your own leave requests'
        });
      }
    } else if (req.user.role === 'leader') {
      // Leaders can delete leaves from their team
      const team = await teamsCollection.findOne({ leaderId: req.user.id });
      if (!team || leave.teamId?.toString() !== team._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Can only delete leaves from your team'
        });
      }
    }
    // Admins can delete any leave

    // Delete leave
    await leavesCollection.deleteOne({ _id: idValidation.value });

    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully'
    });

  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Main handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Require authentication for all endpoints
  const authenticatedHandler = requireAuth(async (req, res) => {
    const { id } = req.query;

    try {
      if (req.method === 'GET') {
        return await handleGetLeaves(req, res);
      } else if (req.method === 'POST') {
        return await handleCreateLeave(req, res);
      } else if (req.method === 'PUT') {
        return await handleUpdateLeave(req, res);
      } else if (req.method === 'DELETE') {
        return await handleDeleteLeave(req, res);
      } else {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
      }
    } catch (error) {
      console.error('Leaves API error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  return authenticatedHandler(req, res);
}
