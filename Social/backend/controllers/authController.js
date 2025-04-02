const fileService = require('../services/fileService');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const data = await fileService.readUsers();
        const newUser = { id: data.length + 1, name, email, password };
        data.push(newUser);
        await fileService.writeUsers(data);
        res.json({ message: 'User registered', user: newUser });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await fileService.readUsers();
        const user = data.find(u => u.email === email && u.password === password);
        if (user) {
            res.json({ message: 'Login successful', user });
        } else {
            res.status(401).json({ message: 'Login failed' });
        }
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
};

exports.profile = async (req, res) => {
    try {
        const data = await fileService.readUsers();
        res.render('profile.ejs', { user: data[0] || {} });
    } catch (err) {
        console.error('Error fetching profile:', err);  
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const data = await fileService.readUsers();
        if (data[0]) {
            data[0] = { ...data[0], name, email };
            await fileService.writeUsers(data);
            res.json({ message: 'Profile updated', user: data[0] });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const data = await fileService.readUsers();
        if (data[0]) {
            data[0].password = newPassword;
            await fileService.writeUsers(data);
            res.json({ message: 'Password updated' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ message: 'Error updating password', error: err.message });
    }
};
