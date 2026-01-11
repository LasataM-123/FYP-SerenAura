const validAdmin = (req, res, next) => {
    if (req.user && req.user.role==="admin") {
        return next();
    }
    return res.status(403).json({ error: "Unauthorized access. Admin only." });
};

module.exports = { validAdmin };
  