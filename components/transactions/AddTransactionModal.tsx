'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiUsers, FiFileText, FiDollarSign, FiFileMinus } from 'react-icons/fi';
import DateInput from './DateInput';


/**
 * Section wrapper used to visually group related fields inside the form.
 */
function FormSection({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2 text-indigo-600">
        <Icon className="h-4 w-4" />
        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
          {title}
        </h4>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100 disabled:text-gray-400';

export default function AddTransactionModal({
  show,
  onClose,
  formData,
  setFormData,
  clients,
  companies,
  businessTypes,
  handleClientChange,
  handleCompanyChange,
  generateFinancialYears,
  onSubmit,
  submitting,
}) {
  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" open={show} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 z-[999] overflow-y-auto">
          <div className="flex min-h-screen items-start justify-center px-4 pt-8 pb-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-lg font-bold text-white">
                      Add New Transaction
                    </Dialog.Title>
                    <p className="mt-0.5 text-xs text-indigo-100">
                      Fill in the details below to create a new billing entry
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="max-h-[75vh] overflow-y-auto bg-white p-6">
                  <form onSubmit={onSubmit} className="space-y-6">
                    <FormSection icon={FiUsers} title="Client & Company">
                      <Field label="Client" required>
                        <select
                          value={formData.client_id}
                          onChange={handleClientChange}
                          className={inputClass}
                          required
                        >
                          <option value="">Select Client</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Company" required>
                        <select
                          value={formData.company_id}
                          onChange={handleCompanyChange}
                          className={inputClass}
                          required
                          disabled={!formData.client_id}
                        >
                          <option value="">Select Company</option>
                          {companies.map((company) => (
                            <option key={company.company_id} value={company.company_id}>
                              {company.company_name}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Business Type" required>
                        <select
                          value={formData.business_type_id}
                          onChange={(e) =>
                            setFormData({ ...formData, business_type_id: e.target.value })
                          }
                          className={inputClass}
                          required
                          disabled={!formData.company_id}
                        >
                          <option value="">Select Business Type</option>
                          {businessTypes.map((bt) => (
                            <option key={bt.id} value={bt.id}>
                              {bt.name}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Financial Year">
                        <select
                          value={formData.financial_year}
                          onChange={(e) =>
                            setFormData({ ...formData, financial_year: e.target.value })
                          }
                          className={inputClass}
                        >
                          <option value="">Select Financial Year</option>
                          {generateFinancialYears().map((fy) => (
                            <option key={fy} value={fy}>
                              {fy}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </FormSection>

                    <FormSection icon={FiFileText} title="Bill Details">
                      <Field label="Bill Number" required>
                        <input
                          type="text"
                          value={formData.bill_number}
                          onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
                          className={inputClass}
                          required
                          placeholder="INV-001"
                        />
                      </Field>

                      <DateInput
                        label="Bill Date"
                        value={formData.bill_date}
                        required
                        onChange={(date) => setFormData({ ...formData, bill_date: date })}
                      />

                      <Field label="Taxable Value" required>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.taxable_value}
                          onChange={(e) => setFormData({ ...formData, taxable_value: e.target.value })}
                          className={inputClass}
                          required
                          placeholder="0.00"
                        />
                      </Field>

                      <Field label="GST Rate (%)">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.gst_rate}
                          onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                          className={inputClass}
                          placeholder="18"
                        />
                      </Field>

                      <Field label="Govt Fee">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.govt_fee}
                          onChange={(e) => setFormData({ ...formData, govt_fee: e.target.value })}
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </Field>
                    </FormSection>

                    <FormSection icon={FiDollarSign} title="Collection & Payment">
                      <Field label="Collection Amount">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.collection_amount || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, collection_amount: e.target.value })
                          }
                          className={`${inputClass} appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                          placeholder="0.00"
                        />
                      </Field>

                      <DateInput
                        label="Collection Date"
                        value={formData.collection_date}
                        onChange={(date) => setFormData({ ...formData, collection_date: date })}
                      />

                      <Field label="TDS Rate (%)">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.tds_rate}
                          onChange={(e) => setFormData({ ...formData, tds_rate: e.target.value })}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="TDS Received">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.tds_rcvd}
                          onChange={(e) => setFormData({ ...formData, tds_rcvd: e.target.value })}
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </Field>

                      <Field label="Payment Term (days)">
                        <input
                          type="number"
                          value={formData.payment_term}
                          onChange={(e) => setFormData({ ...formData, payment_term: e.target.value })}
                          className={inputClass}
                        />
                      </Field>
                    </FormSection>

                    <FormSection icon={FiFileMinus} title="Credit Note Details">
                      <Field label="Credit Note No.">
                        <input
                          type="text"
                          value={formData.credit_note_no}
                          onChange={(e) => setFormData({ ...formData, credit_note_no: e.target.value })}
                          className={inputClass}
                          placeholder="CN-001"
                        />
                      </Field>

                      <DateInput
                        label="Credit Note Date"
                        value={formData.credit_note_date}
                        onChange={(date) => setFormData({ ...formData, credit_note_date: date })}
                      />

                      <Field label="Credit Note Value">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.credit_note_value}
                          onChange={(e) =>
                            setFormData({ ...formData, credit_note_value: e.target.value })
                          }
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </Field>
                    </FormSection>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 border-t pt-5 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? 'Saving...' : 'Save Transaction'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}