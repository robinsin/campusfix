import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireRole } from '../lib/auth/RequireRole';
import { AuthProvider } from '../lib/auth/AuthContext';

describe('RequireRole Guard Component', () => {
  it('renders child component when role matches allowed roles', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RequireRole allowedRoles={['student_staff', 'admin']}>
                  <div>Protected Content</div>
                </RequireRole>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    });
  });
});
