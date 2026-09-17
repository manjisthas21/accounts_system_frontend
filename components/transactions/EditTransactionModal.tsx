'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiLock, FiDollarSign, FiFileMinus, FiMessageSquare } from 'react-icons/fi';

function FormSection({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2 text-indigo-600">
        <Icon className="h-4 w-4" />
        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
          {title}
        </h4>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, required, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-gray-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100 disabled:text-gray-400';

export default function EditTransactionModal({
  show,
  onClose,
  formData,
  setFormData,
  selectedTransaction,
  onSubmit,
  submitting,
  isSuperAdmin,
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
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-lg font-bold text-white">
                      Edit Transaction
                    </Dialog.Title>
                    {selectedTransaction?.bill_number && (
                      <p className="mt-0.5 text-xs text-indigo-100">
                        Bill No. {selectedTransaction.bill_number}
                      </p>
                    )}
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
                    <Field label="Bill Number">
                      <input value={formData.bill_number} disabled className={inputClass} />
                    </Field>

                    {isSuperAdmin() && (
                      <FormSection icon={FiLock} title="Super Admin Only">
                        <Field label="Taxable Value">
                          <input
                            type="number"
                            value={formData.taxable_value}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                taxable_value: e.target.value === '' ? 0 : Number(e.target.value),
                              }))
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Reason for Editing Taxable Value" required className="md:col-span-2">
                          <textarea
                            value={formData.taxable_value_edit_reason || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                taxable_value_edit_reason: e.target.value,
                              }))
                            }
                            className={`${inputClass} min-h-[70px]`}
                            placeholder="Explain why taxable value is being changed..."
                          />
                        </Field>
                      </FormSection>
                    )}

                    <FormSection icon={FiDollarSign} title="Collection & Payment">
                      <Field label="Collection Amount">
                        <input
                          type="number"
                          value={formData.collection_amount || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              collection_amount: e.target.value === '' ? 0 : Number(e.target.value),
                            }))
                          }
                          className={`${inputClass} appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                        />
                      </Field>

                      <Field label="Collection Date">
                        <input
                          type="date"
                          value={formData.collection_date || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, collection_date: e.target.value }))
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Round Up / Adjustment" className="md:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.round_up ?? ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, round_up: e.target.value }))
                          }
                          className={inputClass}
                          placeholder="e.g. -0.75 to deduct, 0.75 to add"
                        />
                        <p className="mt-1 text-xs text-gray-600">
                          Negative value deducts from balance, positive adds to balance.
                        </p>
                      </Field>

                      <Field label="TDS Rate (%)">
                        <input
                          type="number"
                          value={formData.tds_rate}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, tds_rate: Number(e.target.value || 0) }))
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="TDS Received">
                        <input
                          type="number"
                          value={formData.tds_rcvd}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, tds_rcvd: Number(e.target.value || 0) }))
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Payment Term (Days)">
                        <input
                          type="number"
                          value={formData.payment_term}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              payment_term: Number(e.target.value || 30),
                            }))
                          }
                          className={inputClass}
                        />
                      </Field>
                    </FormSection>

                    <FormSection icon={FiFileMinus} title="Credit Note">
                      <Field label="Credit Note No">
                        <input
                          type="text"
                          value={formData.credit_note_no || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, credit_note_no: e.target.value }))
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Credit Note Date">
                        <input
                          type="date"
                          value={formData.credit_note_date || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, credit_note_date: e.target.value }))
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Credit Note Value" className="md:col-span-2">
                        <input
                          type="number"
                          value={formData.credit_note_value}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              credit_note_value: Number(e.target.value || 0),
                            }))
                          }
                          className={inputClass}
                        />
                      </Field>
                    </FormSection>

                    <FormSection icon={FiMessageSquare} title="Remarks">
                      <Field label="Remarks" className="md:col-span-2">
                        <textarea
                          value={formData.remarks || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                          }
                          className={`${inputClass} min-h-[80px]`}
                          placeholder="Enter remarks..."
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
                        {submitting ? 'Updating...' : 'Update'}
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