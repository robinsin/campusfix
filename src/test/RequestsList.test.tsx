import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MyRequestsPage } from '../pages/student/MyRequestsPage';
import { AuthProvider } from '../lib/auth/AuthContext';

describe('MyRequestsPage Component', () => {
  it('renders my requests title and table filters', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <MyRequestsPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /my service requests/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by ticket id/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/WO-2031/i)).toBeInTheDocument();
    });
  });
});
