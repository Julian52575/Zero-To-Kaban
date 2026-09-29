import type { User } from '../types/user';

export async function getCurrentUser(): Promise<User> {
    const response = await fetch('/api/users/me');

    if (!response.ok) {
        throw new Error('Failed to retrieve user profile');
    }

    return response.json();
}

export async function updateUser(
    user: User,
): Promise<User> {
    const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: user.username,
            email: user.email,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to update user profile');
    }

    return response.json();
}

export async function deleteUser(userId: string): Promise<void> {
    const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete user account');
    }
}

export async function logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error('Failed to logout');
    }
}