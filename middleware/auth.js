const jwt = require('jsonwebtoken');
const userModel = require('../models/userModels'); // Adjust path if your userModels is elsewhere

/**
 * Middleware to protect routes by verifying JWT token.
 * Attaches user object to req.user if authentication is successful.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided or incorrect format" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId).select("-password"); // Exclude password
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    req.user = user; // Attach user to request object
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    console.error("Authentication error:", error);
    return res.status(500).json({ message: "Internal server error during authentication" });
  }
};

/**
 * Middleware to authorize users based on roles.
 * @param {string|string[]} requiredRoles - The role(s) required to access the route.
 */
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    // req.user should be populated by the 'protect' middleware
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Forbidden: User role not available. Ensure you are authenticated." });
    }
    const userRole = req.user.role; // Assuming User model has a 'role' field (e.g., 'admin', 'user')
    const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!rolesToCheck.includes(userRole)) {
      return res.status(403).json({ message: `Forbidden: Access restricted. Required role(s): ${rolesToCheck.join(', ')}` });
    }
    next();
  };
};

module.exports = { protect, authorize };