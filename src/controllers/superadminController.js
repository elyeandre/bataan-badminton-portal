const path = require('path');
const serveFile = require('../utils/fileUtils');
const User = require('../models/User');
const Court = require('../models/Court');
const Post = require('../models/Post');
const Reservation = require('../models/Reservation');
const Order = require('../models/Order');
const { log, error } = console;
const { getAddressFromCoordinates } = require('../utils/addressUtils');
const { extractMunicipality, bataanMunicipalities } = require('../utils/municipalityExtractor');

exports.getSuperadminDashboard = (req, res, next) => {
  const filePath = path.resolve(__dirname, '../../build/superadmindashboard.html');
  serveFile(filePath, res, next);
};

// handle court approval or rejection and update the associated user's isCourtApproved field
exports.handleCourtApproval = async (req, res, next) => {
  const courtId = req.params.courtId;
  const action = req.params.action; // action will either be "approve" or "reject"

  try {
    // find the court by ID
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Court not found'
      });
    }

    // update the court status based on the action
    if (action === 'approve') {
      court.status = 'approved';
      await court.save();

      // find the associated user and update the isCourtApproved field
      const user = await User.findById(court.user); // assuming court has a user field with the user ID
      if (user) {
        user.isCourtApproved = true;
        await user.save();
      }

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Court approved successfully'
      });
    } else if (action === 'reject') {
      court.status = 'rejected';
      await court.save();

      // find the associated user and update the isCourtApproved field
      const user = await User.findById(court.user); // assuming court has a user field with the user ID
      if (user) {
        user.isCourtApproved = false;
        await user.save();
      }

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Court rejection processed successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Invalid action specified'
      });
    }
  } catch (err) {
    error('Error handling court approval/rejection:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('court');
    return res.status(200).json({
      success: true,
      code: 200,
      data: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

exports.getCourtOwners = async (req, res) => {
  const { 
    status, 
    municipality,
    search = '',
    page = 1,
    limit = 25,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  try {
    // validate the status if provided
    if (status && !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Invalid status. Please use "approved", "rejected", "pending", or leave it empty to fetch all.'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query object
    let query = {};
    if (status) {
      query.status = status;
    }

    // Text search across multiple fields
    if (search) {
      query.$or = [
        { business_name: { $regex: search, $options: 'i' } },
        { business_email: { $regex: search, $options: 'i' } },
        { dti_number: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries with pagination
    const [courts, totalCount] = await Promise.all([
      Court.find(query)
        .populate('user')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Court.countDocuments(query)
    ]);

    const courtsWithAddresses = await Promise.all(
      courts.map(async (court) => {
        // if coordinates are available, fetch the address
        if (court.location && court.location.coordinates) {
          try {
            const fullAddress = await getAddressFromCoordinates(court.location.coordinates);
            console.log(fullAddress);

            const extractedMunicipality = extractMunicipality(fullAddress);

            // if the address contains a Bataan municipality, truncate the string to remove everything after the municipality
            let trimmedAddress = fullAddress;
            if (bataanMunicipalities.includes(extractedMunicipality)) {
              const municipalityIndex = fullAddress.indexOf(extractedMunicipality);
              trimmedAddress = fullAddress.substring(0, municipalityIndex + extractedMunicipality.length);
            }

            return { ...court.toObject(), address: trimmedAddress, municipality: extractedMunicipality };
          } catch (error) {
            return { ...court.toObject(), address: 'Address not found' }; // return with fallback address
          }
        }
        // if no coordinates, return the court object without an address
        return { ...court.toObject(), address: 'No coordinates provided' };
      })
    );

    // filter by municipality if provided (after address resolution)
    const filteredCourts = municipality
      ? courtsWithAddresses.filter((court) => court.municipality === municipality)
      : courtsWithAddresses;

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      success: true,
      code: 200,
      data: {
        courts: filteredCourts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount: filteredCourts.length, // Use filtered count for display
          originalTotalCount: totalCount, // Keep original for reference
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (err) {
    console.error('Error fetching court owners:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

// add the new endpoint to get court details by courtId
exports.getCourtById = async (req, res) => {
  const { courtId } = req.params;

  try {
    // find the court by its ID
    const court = await Court.findById(courtId).populate('user');

    if (!court) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Court not found'
      });
    }

    const { location, ...courtData } = court.toObject();

    let address = 'No coordinates provided';

    // if coordinates are available, fetch the address
    if (location && location.coordinates) {
      try {
        address = await getAddressFromCoordinates(location.coordinates);
        log(address);
      } catch (error) {
        address = 'Address not found'; // fallback if address can't be fetched
      }
    }

    return res.status(200).json({
      success: true,
      code: 200,
      data: { ...courtData, address }
    });
  } catch (err) {
    console.error('Error fetching court details:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('court');

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      code: 200,
      data: user
    });
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

// New search users endpoint with pagination and filtering
exports.searchUsers = async (req, res) => {
  try {
    const {
      search = '',
      role = '',
      gender = '',
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let query = {};

    // Text search across multiple fields
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { municipality: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by gender
    if (gender) {
      query.gender = gender;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .populate('court')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      success: true,
      code: 200,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (err) {
    console.error('Error searching users:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

// Update user endpoint
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.refreshToken;
    delete updateData.otp;
    delete updateData.otpExpires;
    delete updateData.verificationNonce;
    delete updateData.resetPasswordNonce;

    // Find and update the user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate('court');

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      code: 200,
      message: 'User updated successfully',
      data: user
    });
  } catch (err) {
    console.error('Error updating user:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Validation error',
        errors: Object.values(err.errors).map(e => e.message)
      });
    }

    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

// Delete user endpoint with cascading delete
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user first to check what needs to be deleted
    const user = await User.findById(userId).populate('court');

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'User not found'
      });
    }

    // Count related data that will be deleted
    const [postsCount, reservationsCount, ordersCount] = await Promise.all([
      Post.countDocuments({ userId: userId }),
      Reservation.countDocuments({ user: userId }),
      Order.countDocuments({ user: userId })
    ]);

    // Start cascading delete
    await Promise.all([
      // Delete user's posts
      Post.deleteMany({ userId: userId }),
      // Delete user's reservations  
      Reservation.deleteMany({ user: userId }),
      // Delete user's orders
      Order.deleteMany({ user: userId })
    ]);

    // Delete the user (this will trigger the post middleware to delete Files and Court)
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      code: 200,
      message: 'User and all related data deleted successfully',
      deletedData: {
        posts: postsCount,
        reservations: reservationsCount,
        orders: ordersCount,
        court: user.court ? 1 : 0
      }
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};
