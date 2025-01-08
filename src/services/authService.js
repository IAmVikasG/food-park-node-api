const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const EmailService = require('./emailService');
const CustomError = require('../utils/customError');
const pool = require('../config/database');

class AuthService
{
    static generateToken(user)
    {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
    }

    static async register(userData)
    {
        const existingUser = await User.findByEmail(userData.email);
        if (existingUser)
        {
            throw new CustomError('Email already registered', 400);
        }

        const user = await User.create(userData);
        const token = this.generateToken(user);

        // Send welcome email
        await EmailService.sendWelcomeEmail(user.email, user.name);

        return { user, token };
    }

    static async login(email, password)
    {
        const user = await User.findByEmail(email);
        if (!user)
        {
            throw new CustomError('Invalid credentials', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
        {
            throw new CustomError('Invalid credentials', 401);
        }

        const token = this.generateToken(user);
        return { user, token };
    }

    static async forgotPassword(email)
    {
        const user = await User.findByEmail(email);
        if (!user)
        {
            // Don't reveal whether email exists
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Store reset token in database (you'll need to add this field)
        await pool.execute(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetTokenHash, new Date(Date.now() + 3600000), user.id]
        );

        await EmailService.sendPasswordResetEmail(
            user.email,
            `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
        );
    }

    static async resetPassword(token, newPassword)
    {
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const [rows] = await pool.execute(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?',
            [resetTokenHash, new Date()]
        );

        if (!rows[0])
        {
            throw new CustomError('Invalid or expired reset token', 400);
        }

        await User.updatePassword(rows[0].id, newPassword);

        // Clear reset token
        await pool.execute(
            'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [rows[0].id]
        );
    }
}

module.exports = AuthService;