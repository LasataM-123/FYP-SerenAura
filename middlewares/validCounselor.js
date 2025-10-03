const validCounselor = (req, res, next) => {
    if (req.user && req.user.role==="Counselor") {
        return next();
    }
    return res.status(403).json({ error: "Unauthorized access. Counselor only." });
};

module.exports = { validCounselor };
  