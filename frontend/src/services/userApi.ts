import type { User } from '../types/user';

export async function getCurrentUser(): Promise<User> {
    const response = await fetch('/auth/me');

    if (!response.ok) {
        throw new Error('Failed to retrieve user profile');
    }

    return response.json();
}

export async function updateMe(
    username : string,
): Promise<User> {
    const response = await fetch(`/auth/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to update user profile');
    }

    return response.json();
}

export async function deleteMe(password: string): Promise<void> {
    const response = await fetch(`/auth/me`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            password: password,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to delete user account');
    }
}

export async function logout(): Promise<void> {
    const response = await fetch('/auth/logout-all', {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error('Failed to logout');
    }
}

export async function downloadUserData(): Promise<Blob> {
    const response = await fetch('/auth/me/export', {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Failed to download user data');
    }

    return response.blob();
}