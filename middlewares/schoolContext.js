export const schoolContext = (req, res, next) => {
  const { role, id, schoolId } = req.user;

  // Admin owns the school
  if (role === "admin") {
    req.schoolAdminId = id;
    return next();
  }

  // Accountant belongs to an admin (school)
  if (role === "accountant") {
    if (!schoolId) {
      return res
        .status(403)
        .json({ message: "Accountant not linked to any school" });
    }

    req.schoolAdminId = schoolId;
    return next();
  }

  return res.status(403).json({ message: "Invalid school context" });
};
