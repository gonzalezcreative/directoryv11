import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { LeadProvider } from '../context/LeadContext';

function render(ui: React.ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  return rtlRender(
    <BrowserRouter>
      <AuthProvider>
        <LeadProvider>
          {ui}
        </LeadProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export * from '@testing-library/react';
export { render };