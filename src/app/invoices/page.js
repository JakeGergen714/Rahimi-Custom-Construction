'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import InsertInvoiceModal from './modal';
import DateFilter from './datefilter';

const AdminInvoicesPage2 = () => {
  const [invoices, setInvoices] = useState([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null); // Store the pagination key
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRowIndex, setExpandedRowIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // New state for Load More button
  const [voidInvoice, setVoidInvoice] = useState(null);

  const contentRef = useRef([]);
  const dateFilterRef = useRef(null);
  const menuRef = useRef(null);

  const [filters, setFilters] = useState({
    date: null,
    paid: false,
    unpaid: false,
  });

  const [showDateFilter, setShowDateFilter] = useState(false);

  const applyDateFilter = (dateFilter) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      date: dateFilter,
    }));

    setTimeout(() => {
      setShowDateFilter(false);
    }, 10); // Set the delay to 100ms (can be tweaked as necessary)
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dateFilterRef.current &&
        !dateFilterRef.current.contains(event.target)
      ) {
        setShowDateFilter(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setInvoiceOptionsOpen(null); // Close the menu when clicking outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dateFilterRef]);

  const applyPaidFilter = (paid) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      paid: prevFilters.paid ? false : paid, // Toggle paid filter
      unpaid: false, // Ensure unpaid is reset when paid is selected
    }));
  };

  const applyUnpaidFilter = (unpaid) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      unpaid: prevFilters.unpaid ? false : unpaid, // Toggle unpaid filter
      paid: false, // Ensure paid is reset when unpaid is selected
    }));
  };

  const fetchAdminInvoices = async (isNextPage = false) => {
    try {
      const params = new URLSearchParams();

      // Add filters if they exist
      if (filters.paid) params.append('status', 'Paid');
      if (filters.unpaid) params.append('status', 'Unpaid');
      if (filters.date) {
        params.append('startDate', filters.date.startDate.toISOString());
        params.append('endDate', filters.date.endDate.toISOString());
      }

      // If paginating, pass the last key
      if (isNextPage && lastEvaluatedKey) {
        params.append(
          'lastKey',
          encodeURIComponent(JSON.stringify(lastEvaluatedKey))
        );
      }

      const url = `/api/admin-invoice-fetch?${params.toString()}`;
      if (isNextPage) setIsLoadingMore(true);
      else setLoading(true);

      const response = await fetch(url, { method: 'GET' });

      if (response.status === 401) {
        window.location.href = 'login';
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        if (isNextPage) {
          setInvoices((prevInvoices) => {
            const combinedInvoices = [...prevInvoices, ...data.data];

            // Remove duplicates
            const uniqueInvoices = combinedInvoices.filter(
              (invoice, index, self) =>
                index === self.findIndex((i) => i.id === invoice.id)
            );

            return uniqueInvoices;
          });
        } else {
          setInvoices(data.data); // Reset with the new filtered data
        }

        // Set the next key for pagination
        setLastEvaluatedKey(data.lastEvaluatedKey || null);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false); // End "Load More" loading state
    }
  };

  useEffect(() => {
    fetchAdminInvoices();
  }, [filters]);

  const handleCreateInvoice = async (newInvoice) => {
    try {
      const response = await fetch('/api/admin-invoice-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInvoice),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      const data = await response.json();
      setInvoices((prevInvoices) => [data.invoice, ...prevInvoices]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleVoidInvoice = async (invoice) => {
    setVoidInvoice(null);
    setInvoices((prevInvoices) => {
      // Map over the previous invoices and update the status of the matched invoice
      return prevInvoices.map(
        (current) =>
          current.id === invoice.id
            ? { ...invoice, status: 'Voided' } // Update status to 'Voided'
            : current // Return unchanged invoice for others
      );
    });
    setExpandedRowIndex(null);
    try {
      const response = await fetch('/api/admin-invoice-void', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
      });

      if (!response.ok) {
        throw new Error('Failed to void invoice');
      }
    } catch (error) {
      console.error('Error voiding invoice:', error);
    }
  };

  const toggleRow = (index) => {
    setExpandedRowIndex(expandedRowIndex === index ? null : index);
  };

  return (
    <div className='flex h-screen'>
      {/* Main content area */}
      <div className='flex-1 main-content-container bg-gray-200 w-4/5 h-full p-6 w-full'>
        <div className='innerContainer sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto flex flex-col h-full'>
          <h1 className='text-3xl font-semibold mb-6'>Admin Panel</h1>

          {/* Invoice Table */}
          <div className='bg-white p-4 shadow rounded-lg max-w-full flex flex-col flex-grow h-full min-h-0'>
            <h2 className='text-2xl font-medium mb-4'>Invoices</h2>

            {/* Filters */}
            <div className='flex flex-wrap pt-4 border-b pb-2 gap-2 sm:gap-4'>
              <div
                className={`cursor-pointer rounded-full border-dashed border-2 px-2 text-slate-400 flex-grow sm:flex-grow-0 ${
                  filters.date ? 'bg-gray-200' : ''
                }`}
                onClick={() => {
                  if (filters.date) {
                    // If a date filter is already applied, remove it (set to null)
                    setFilters((prevFilters) => ({
                      ...prevFilters,
                      date: null,
                    }));
                  } else {
                    // Otherwise, open the date filter
                    setShowDateFilter(true);
                  }
                }}
              >
                Date and time
              </div>
              {showDateFilter ? (
                <div className='absolute pt-8' ref={dateFilterRef}>
                  <DateFilter onApply={applyDateFilter}></DateFilter>
                </div>
              ) : null}

              <div
                onClick={() => applyPaidFilter(!filters.paid)}
                className={`cursor-pointer rounded-full border-dashed border-2 px-2 text-slate-400 flex-grow sm:flex-grow-0 ${
                  filters.paid ? 'bg-gray-200' : ''
                }`}
              >
                Paid
              </div>
              <div
                onClick={() => applyUnpaidFilter(!filters.unpaid)}
                className={`cursor-pointer rounded-full border-dashed border-2 px-2 text-slate-400 flex-grow sm:flex-grow-0 ${
                  filters.unpaid ? 'bg-gray-200' : ''
                }`}
              >
                Unpaid
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className='bg-blue-500 text-white rounded-lg px-2 py-1 sm:px-6 hover:bg-blue-600 transition-all ml-auto flex-grow sm:flex-grow-0'
              >
                + Create New Invoice
              </button>
            </div>
            {loading && (
              <div className='flex justify-center items-center h-full'>
                <div className='spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600'>
                  <span className='sr-only'>Loading...</span>
                </div>
              </div>
            )}

            <div className='table-container overflow-y-auto flex-grow min-h-0'>
              <table className='table-auto w-full text-center'>
                <thead className='border-b'>
                  <tr>
                    <th className='py-1 px-1 text-gray-400 font-medium'></th>
                    <th className='py-1 px-1 text-gray-400 font-medium'>
                      Amount
                    </th>
                    <th className='py-1 px-1 text-gray-400 font-medium'>
                      Customer Email
                    </th>
                    <th className='py-1 px-1 text-gray-400 font-medium'>
                      Date
                    </th>
                    <th className='py-1 px-1 text-gray-400 font-medium'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='text-black divide-y-2 divide-gray-200'>
                  {invoices.map((invoice, index) => (
                    <React.Fragment key={invoice.id}>
                      <tr>
                        <td
                          className='py-2 px-1 pl-2 cursor-pointer text-blue-400 hover:text-blue-600'
                          onClick={() => toggleRow(index)}
                        >
                          {expandedRowIndex === index ? (
                            <AiOutlineMinus size={20} />
                          ) : (
                            <AiOutlinePlus size={20} />
                          )}
                        </td>
                        <td className='py-1 px-1'>
                          <div className='flex'>
                            ${Number(invoice.invoiceAmount).toFixed(2)}
                          </div>
                        </td>
                        <td
                          className='py-1 px-1 font-semibold max-w-10 truncate whitespace-nowrap overflow-hidden'
                          title={invoice.customerEmail}
                        >
                          {invoice.customerEmail}
                        </td>
                        <td className='py-1 px-1'>
                          {new Intl.DateTimeFormat('en-US', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit',
                          }).format(new Date(invoice.date))}
                        </td>

                        <td>{invoice.status}</td>
                      </tr>

                      {expandedRowIndex === index && (
                        <tr className='expanded-content'>
                          <td colSpan='5'>
                            <div
                              ref={(el) => (contentRef.current[index] = el)}
                              className='transition-all duration-500 ease-in-out overflow-hidden'
                              style={{
                                maxHeight:
                                  expandedRowIndex === index
                                    ? contentRef.current[index]?.scrollHeight +
                                      'px'
                                    : '0px',
                              }}
                            >
                              <div className='py-1 px-1 sm:px-6 bg-slate-900 rounded-lg m-2 overflow-y-auto'>
                                <div className='border-gray-600 mb-4'>
                                  <div className='flex justify-between text-lg font-semibold text-gray-200'>
                                    <span>{invoice.customerEmail}</span>
                                  </div>
                                </div>
                                <div className='mb-4'>
                                  <p className='font-semibold text-lg text-gray-100 mb-2'>
                                    Invoice Details
                                  </p>
                                  <div className='border-t border-gray-600'>
                                    {invoice.lineItems.map((item, i) => (
                                      <div
                                        key={i}
                                        className='flex justify-between py-2 text-gray-400'
                                      >
                                        <span>{item.description}</span>
                                        <span className='font-medium'>
                                          ${Number(item.amount).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className='border-t border-gray-600 pt-4'>
                                  <div className='flex justify-between text-lg font-semibold text-gray-200'>
                                    <span>Total</span>
                                    <span>
                                      $
                                      {Number(invoice.invoiceAmount).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setVoidInvoice(invoice)}
                              className='bg-red-500 text-white rounded-lg mb-2 px-2 py-1 sm:px-6 hover:bg-red-600 transition-all ml-auto flex-grow sm:flex-grow-0'
                            >
                              Void Invoice
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {lastEvaluatedKey && (
              <div className='flex justify-center mt-4'>
                <button
                  onClick={() => fetchAdminInvoices(true)}
                  className='bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600 transition-all'
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Loading More...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <InsertInvoiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateInvoice}
        />
      )}
      {voidInvoice && (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50'>
          <div className='bg-white p-8 rounded-lg shadow-lg max-w-lg w-full'>
            <h2 className='text-2xl font-bold mb-4'>Confirm Invoice</h2>
            <p className='mb-4'>
              Customer Email: <strong>{voidInvoice.customerEmail}</strong>
            </p>
            <p className='mb-4'>
              Amount: <strong>${Number(voidInvoice.amount).toFixed(2)}</strong>
            </p>
            <p>Are you sure you want to void this invoice?</p>
            <div className='flex justify-end mt-4'>
              <button
                className='bg-gray-400 text-white rounded-lg px-4 py-2 mr-2'
                onClick={() => setVoidInvoice(null)}
              >
                Cancel
              </button>
              <button
                className='bg-blue-500 text-white rounded-lg px-4 py-2'
                onClick={() => handleVoidInvoice(voidInvoice)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoicesPage2;
