const validPatient = (req, res, next) => {
    if (req.user && req.user.role==="patient") {
        return next();
    }
    return res.status(403).json({ error: "Unauthorized access. Patient only." });
};

module.exports = { validPatient };
  