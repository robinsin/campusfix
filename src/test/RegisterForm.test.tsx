import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { RegisterPage } from '../pages/RegisterPage';
import { AuthProvider } from '../lib/auth/AuthContext';

describe('RegisterPage Component', () => {
  it('renders registration fields and security notice', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/all new registrations default to student\/staff role/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/jane doe/i)).toBeInTheDocument();
  });

  it('triggers inline errors when passwords do not match', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i);
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'different123' } });

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });
});
