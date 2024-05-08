

const { Employee } = require('../models/employees');
const session = require('express-session');
async function trackUserActivity(req) {
    const userId = req.session.userId;
    try {
        if (userId) {
            const user = await Employee.findByIdAndUpdate(userId, { lastActivity: new Date() });
            console.log('Last activity updated for user:', user);
        }
    } catch (error) {
        console.error('Error updating last activity:', error);
    }
}


function checkIdleUsers() {
    const idleThreshold = 15 * 60 * 1000; 
    console.log(idleThreshold)
    Employee.find({ lastActivity: { $lt: new Date(Date.now() - idleThreshold) } })
        .then(idleUsers => {
            idleUsers.forEach(employee => {
                if (employee.attendance.length > 0) {
                    const lastAttendance = employee.attendance[employee.attendance.length - 1];
                    if (!lastAttendance.checkOutTime) {
                        lastAttendance.checkOutTime = new Date().toISOString(); // Set checkout time
                        employee.save()
                            .then(() => console.log('Employee saved successfully'))
                            .catch(err => console.error('Error saving employee:', err));
                    }
                }
                // Perform logout logic here
                // Example: req.session.destroy();
            });
        })
        .catch(err => {
            console.error('Error finding idle users:', err);
        });
}

module.exports = { trackUserActivity, checkIdleUsers };
