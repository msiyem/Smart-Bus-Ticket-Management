export const Authorize = (...allowRoles) => {
  return (req,res,next)=>{
    const userRole = req.user.role;
    if(!allowRoles.includes(userRole)){
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to access this resource."
      })
    }
    next();
  }
}