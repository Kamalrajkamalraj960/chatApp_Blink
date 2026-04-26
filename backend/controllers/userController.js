import User from '../models/User.js';

// @desc    Get all users (search & paginate)
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
        $or: [
          { username: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ]
      }
      : {};

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Exclude current user and blocked users
    const query = {
      ...keyword,
      _id: { $ne: req.user._id }
    };

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ isOnline: -1, lastSeen: -1 }); // Online users first

    const total = await User.countDocuments(query);

    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update Profile

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // text fields
    if (req.body.username) user.username = req.body.username;
    if (req.body.bio) user.bio = req.body.bio;

    // image upload
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();

    // 🔥 IMPORTANT: return fresh user
    const freshUser = await User.findById(user._id).select("-password");

    res.status(200).json(freshUser);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

