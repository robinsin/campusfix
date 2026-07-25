import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider } from '../lib/auth/AuthContext';

describe('LoginPage Component', () => {
  it('renders sign in form with fields', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /campusfix sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@university.edu/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  it('shows inline validation error when submitting empty email', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/name@university.edu/i);
    fireEvent.change(emailInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /sign in to dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('allows user to enter credentials into input fields', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/name@university.edu/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'alex.j@university.edu' } });
    expect(emailInput.value).toBe('alex.j@university.edu');
  });
});
