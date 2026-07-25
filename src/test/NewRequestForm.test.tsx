import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { NewRequestPage } from '../pages/student/NewRequestPage';
import { AuthProvider } from '../lib/auth/AuthContext';

describe('NewRequestPage Component', () => {
  it('renders form elements', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <NewRequestPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /report facilities issue/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/water leak under sink/i)).toBeInTheDocument();
  });

  it('validates minimum length for title and description', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <NewRequestPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const titleInput = screen.getByPlaceholderText(/water leak under sink/i);
    fireEvent.change(titleInput, { target: { value: 'ab' } });

    const submitBtn = screen.getByRole('button', { name: /submit work order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/title must be at least 5 characters long/i)).toBeInTheDocument();
    });
  });
});
