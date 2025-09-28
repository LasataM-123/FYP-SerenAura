const validAdmin = (req, res, next) => {
    if (req.user && req.user.isCounselor) {
        return next();
    }
    return res.status(403).json({ error: "Unauthorized access. Admin only." });
};

module.exports = validAdmin;

  
module.exports = { validAdmin };
  