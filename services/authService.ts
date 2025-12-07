
import { User, UserRole, UserPreferences, DisasterType, SeverityLevel, PendingUpdate } from '../types';

const USERS_STORAGE_KEY = 'aura_users';
const CURRENT_USER_KEY = 'aura_current_user_id';

// Default preferences for new users
const DEFAULT_PREFERENCES: UserPreferences = {
  notificationsEnabled: true,
  email: '',
  emailVerified: false,
  minSeverity: SeverityLevel.HIGH,
  subscribedTypes: [DisasterType.FLOOD, DisasterType.TYPHOON, DisasterType.EARTHQUAKE, DisasterType.TSUNAMI],
  watchZones: []
};

// Mock password hashing (In production, use crypto.subtle or bcrypt on server)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

interface StoredUser extends User {
  passwordHash: string;
}

export const authService = {
  init() {
    // Initialize Admin if not exists
    const users = this.getStoredUsers();
    const adminExists = users.find(u => u.username === 'admin');

    if (!adminExists) {
      // Use environment variable for admin password, fallback if missing
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const adminUser: StoredUser = {
        id: 'admin-001',
        username: 'admin',
        role: 'ADMIN',
        passwordHash: hashPassword(adminPassword),
        preferences: { ...DEFAULT_PREFERENCES, email: 'admin@aura.internal', emailVerified: true },
        createdAt: new Date().toISOString()
      };
      users.push(adminUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      console.log('Admin account initialized.');
    }
  },

  getStoredUsers(): StoredUser[] {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  login(username: string, password: string): User | null {
    const users = this.getStoredUsers();
    const user = users.find(u => u.username === username && u.passwordHash === hashPassword(password));
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, user.id);
      // Return user without password hash
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },

  register(username: string, password: string, email: string): User | null {
    const users = this.getStoredUsers();
    if (users.find(u => u.username === username)) {
      return null; // Username taken
    }

    const newUser: StoredUser = {
      id: Date.now().toString(),
      username,
      passwordHash: hashPassword(password),
      role: 'USER',
      preferences: { 
        ...DEFAULT_PREFERENCES, 
        email,
        emailVerified: false 
      },
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, newUser.id);

    this.sendVerificationEmail(newUser.id, email);

    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser(): User | null {
    const id = localStorage.getItem(CURRENT_USER_KEY);
    if (!id) return null;
    const users = this.getStoredUsers();
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },

  /**
   * Updates user profile. 
   * - Immediate update for non-sensitive data (zones, notifications prefs).
   * - "Pending" update for sensitive data (email, password) requiring verification.
   */
  updateProfile(user: User, newPassword?: string): { success: boolean, pending: boolean, message?: string } {
    const users = this.getStoredUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index === -1) return { success: false, pending: false, message: 'User not found' };

    const storedUser = users[index];
    let isSensitiveChange = false;
    let pendingChanges: PendingUpdate | undefined = undefined;

    // 1. Check for Email Change
    if (user.preferences.email !== storedUser.preferences.email) {
      isSensitiveChange = true;
      pendingChanges = {
        ...pendingChanges || { verificationToken: '', requestedAt: '' },
        newEmail: user.preferences.email,
        verificationToken: Math.random().toString(36).substring(2, 15),
        requestedAt: new Date().toISOString()
      };
      // Revert email in the stored object to old email until verified
      user.preferences.email = storedUser.preferences.email;
      user.preferences.emailVerified = storedUser.preferences.emailVerified;
    }

    // 2. Check for Password Change
    if (newPassword) {
      isSensitiveChange = true;
      pendingChanges = {
        ...pendingChanges || { verificationToken: Math.random().toString(36).substring(2, 15), requestedAt: new Date().toISOString() },
        newPasswordHash: hashPassword(newPassword)
      };
    }

    // 3. Apply non-sensitive updates immediately (Zones, Filters, etc.)
    const { pendingUpdate: _, ...userToMerge } = user; // Exclude pendingUpdate from input arg
    users[index] = {
      ...storedUser,
      ...userToMerge, // Merge preferences
      pendingUpdate: pendingChanges || storedUser.pendingUpdate // Set new pending or keep existing
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // 4. Handle Pending Verification Logic
    if (isSensitiveChange && pendingChanges) {
      // Send verification to NEW email if email changed, otherwise CURRENT email
      const targetEmail = pendingChanges.newEmail || storedUser.preferences.email;
      
      this.sendUpdateVerificationEmail(storedUser.id, targetEmail, pendingChanges.verificationToken, !!pendingChanges.newPasswordHash);
      
      return { 
        success: true, 
        pending: true, 
        message: `Verification link sent to ${targetEmail}. Changes will apply after confirmation.` 
      };
    }

    return { success: true, pending: false, message: 'Profile updated successfully' };
  },

  // Simulate sending a verification email for new account
  sendVerificationEmail(userId: string, email: string) {
    if (!email) return;
    const verificationLink = `?verify_user=${userId}`;
    console.log(`
      [EMAIL SIMULATION - REGISTRATION]
      To: ${email}
      Subject: Verify your AURA Sentinel email
      Body: Please click to verify: ${window.location.origin}${verificationLink}
    `);
  },

  // Simulate sending a verification email for profile updates
  sendUpdateVerificationEmail(userId: string, email: string, token: string, isPasswordChange: boolean) {
    if (!email) return;
    const verificationLink = `?confirm_update=${token}`;
    const action = isPasswordChange ? 'Security Update (Password)' : 'Email Change';
    
    console.log(`
      [EMAIL SIMULATION - ${action.toUpperCase()}]
      To: ${email}
      Subject: Confirm your AURA Account Changes
      Body: 
      A request was made to update your ${isPasswordChange ? 'password' : 'email'}.
      Please click the link below to CONFIRM and APPLY these changes:
      
      ${window.location.origin}${verificationLink}
      
      If you did not request this, please ignore this email.
    `);
  },

  // Verify new account email (Activation)
  verifyUserEmail(userId: string): boolean {
    const users = this.getStoredUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index !== -1) {
        if (users[index].preferences.emailVerified) return true;
        users[index].preferences.emailVerified = true;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        return true;
    }
    return false;
  },

  // Confirm pending updates (Email/Password change)
  confirmPendingUpdate(token: string): boolean {
    const users = this.getStoredUsers();
    // Find user with matching token in pendingUpdate
    const index = users.findIndex(u => u.pendingUpdate?.verificationToken === token);

    if (index !== -1) {
      const user = users[index];
      const pending = user.pendingUpdate!;

      // Apply Email Change
      if (pending.newEmail) {
        user.preferences.email = pending.newEmail;
        user.preferences.emailVerified = true; // Auto-verify the new email
      }

      // Apply Password Change
      if (pending.newPasswordHash) {
        user.passwordHash = pending.newPasswordHash;
      }

      // Clear pending state
      user.pendingUpdate = undefined;
      
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      
      // Update current session if it matches the verified user
      if (localStorage.getItem(CURRENT_USER_KEY) === user.id) {
         // Force reload of session data in App by returning true
      }
      return true;
    }
    return false;
  },

  // Admin Methods
  getAllUsers(): User[] {
    return this.getStoredUsers().map(({ passwordHash, ...u }) => u);
  },

  deleteUser(userId: string) {
    let users = this.getStoredUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
};
