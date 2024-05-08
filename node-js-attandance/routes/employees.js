const express = require("express");
const router = express.Router();
const { Employee } = require("../models/employees"); 
const bcrypt=require("bcrypt");
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) { 
            return res.status(403).json({ message: "Unauthorized access" });
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
router.post("/employee-register", async (req, res) => {
    try {
        const { username, password, email, Position, Department, Name } = req.body;

       
        const existingUsername = await Employee.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        
        const existingEmail = await Employee.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

       
        const newEmployee = new Employee({
            username,
            password,
            email,
            Position,
            Department,
            Name
        });

       
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        newEmployee.password = hashedPassword;

        
        await newEmployee.save();

        res.status(201).json({ message: "Employee registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});






router.post("/update-employee-details/:id", async (req, res) => {
    try {
        const { Position, Department, Name } = req.body;

        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            { Position, Department, Name },
            { new: true }
        );

        res.status(200).json({ message: "Employee details updated successfully", updatedEmployee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/employee-details/:id", async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({ message: "Employee details retrieved successfully", employee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});



router.put('/employees/:id',isAdmin, async (req, res) => {
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEmployee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.delete('/employees/:id',isAdmin, async (req, res) => {
    try {
        const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
        res.json(deletedEmployee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.patch('/employees/:id',isAdmin, async (req, res) => {
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEmployee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.post('/employees', isAdmin,async (req, res) => {
    const { Name, Department, Position, JoiningDate, Project, Salary } = req.body;
    const employee = new Employee({Name, Department, Position, JoiningDate, Project, Salary });
    try {
      const newEmployee = await employee.save();
      res.status(201).json(newEmployee);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });


router.get('/employees', async (req, res) => {
    try {
      const employees = await Employee.find();
      res.json(employees);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  

router.get('/employees/:id', async (req, res) => {
    try {
      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      res.json(employee);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });  
module.exports = router;
