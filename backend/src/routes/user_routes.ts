/**
 * @file    Express routes for user management
 * @module  UserRoutes
 * @author  Sammy Stollman
 * @version 1.0
 */


import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/database';
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth';

const router = Router();

const USER_SAFE_SELECT = {
  user_id: true,
  username: true,
  display_name: true,
  register_date: true,
  is_active: true,
  is_admin: true,
  is_approved: true,
  last_login: true,
} as const;

/**
 * PATCH `/api/user`
 * Lets the logged-in user update their own username and/or display name
 */
router.patch('/user', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { username, display_name } = req.body as { username?: string; display_name?: string };

    if (username === undefined && display_name === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const data: { username?: string; display_name?: string } = {};

    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length === 0) {
        return res.status(400).json({ error: "Username cannot be empty" });
      }
      if (username.trim().length > 50) {
        return res.status(400).json({ error: "Username must be 50 characters or fewer" });
      }

      const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
      if (existing && existing.user_id !== req.userId) {
        return res.status(400).json({ error: "Username already exists" });
      }

      data.username = username.trim();
    }

    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.trim().length === 0) {
        return res.status(400).json({ error: "Display name cannot be empty" });
      }
      if (display_name.trim().length > 100) {
        return res.status(400).json({ error: "Display name must be 100 characters or fewer" });
      }

      data.display_name = display_name.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: req.userId },
      data,
      select: USER_SAFE_SELECT,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/**
 * PATCh `/api/user/password`
 * Lets the logged-in user change their password, given their current password
 */
router.patch('/user/password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ error: "Current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({ where: { user_id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { user_id: req.userId },
      data: { password_hash: newPasswordHash },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

/**
 * GET `/api/admin/users`
 * Admin-only: lists every user in the system, including their admin/approval status
 */
router.get('/admin/users', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_SAFE_SELECT,
      orderBy: { register_date: 'asc' },
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * PATCH `/api/admin/users/:userId/approve`
 * Admin-only: approves a pending registration so that user can log in
 */
router.patch('/admin/users/:userId/approve', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: { is_approved: true },
      select: USER_SAFE_SELECT,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

/**
 * DELETE `/api/admin/users/:userId`
 * Admin-only: rejects (deletes) a pending registration request
 */
router.delete('/admin/users/:userId', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (userId === req.userId) {
      return res.status(400).json({ error: "You cannot remove your own account" });
    }

    const targetUser = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.is_approved) {
      return res.status(400).json({ error: "Only pending (unapproved) users can be rejected here" });
    }

    await prisma.user.delete({ where: { user_id: userId } });

    res.json({ message: "User request rejected" });
  } catch (error) {
    console.error("Error rejecting user:", error);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

/**
 * PATCH `/api/admin/users/:userId/admin`
 * Admin-only: grants or revokes admin privileges for another user
 */
router.patch('/admin/users/:userId/admin', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    const { is_admin } = req.body as { is_admin?: boolean };

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (typeof is_admin !== 'boolean') {
      return res.status(400).json({ error: "is_admin must be a boolean" });
    }
    if (userId === req.userId) {
      return res.status(400).json({ error: "You cannot change your own admin status" });
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: { is_admin },
      select: USER_SAFE_SELECT,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating admin status:", error);
    res.status(500).json({ error: "Failed to update admin status" });
  }
});

export default router;
