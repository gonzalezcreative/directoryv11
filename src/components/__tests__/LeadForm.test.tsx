import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/utils';
import LeadForm from '../LeadForm';
import { useLeads } from '../../context/LeadContext';

// Mock the useLeads hook
vi.mock('../../context/LeadContext', () => ({
  useLeads: vi.fn()
}));

describe('LeadForm', () => {
  const mockAddLead = vi.fn();
  const mockOnSubmitSuccess = vi.fn();

  beforeEach(() => {
    vi.mocked(useLeads).mockReturnValue({
      addLead: mockAddLead,
      leads: [],
      loading: false,
      purchaseLead: vi.fn()
    });
  });

  it('renders the form correctly', () => {
    render(<LeadForm onSubmitSuccess={mockOnSubmitSuccess} />);
    
    expect(screen.getByText("What's the occasion?")).toBeInTheDocument();
    expect(screen.getByText('Equipment Types')).toBeInTheDocument();
    expect(screen.getByText('When do you need it?')).toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    render(<LeadForm onSubmitSuccess={mockOnSubmitSuccess} />);

    // Fill out the form
    fireEvent.change(screen.getByRole('combobox', { name: /what's the occasion/i }), {
      target: { value: 'construction' }
    });

    // Add equipment type
    const equipmentInput = screen.getByPlaceholder('Type to search equipment...');
    fireEvent.change(equipmentInput, { target: { value: 'Excavator' } });
    fireEvent.click(screen.getByText('Excavator'));

    // Fill other required fields
    fireEvent.change(screen.getByLabelText(/when do you need it/i), {
      target: { value: '2024-12-31' }
    });

    fireEvent.change(screen.getByRole('combobox', { name: /rental duration/i }), {
      target: { value: 'daily' }
    });

    fireEvent.change(screen.getByRole('combobox', { name: /budget/i }), {
      target: { value: '0-500' }
    });

    // Submit the form
    fireEvent.click(screen.getByText('Submit Request'));

    await waitFor(() => {
      expect(mockAddLead).toHaveBeenCalledWith(expect.objectContaining({
        category: 'construction',
        equipmentTypes: ['Excavator'],
        rentalDuration: 'daily',
        budget: '0-500'
      }));
      expect(mockOnSubmitSuccess).toHaveBeenCalled();
    });
  });
});