"use client";

import { useEffect, useState } from "react";

import {
  companyAPI,
  businessTypeAPI,
  responsiblePersonAPI,
  companyResponsiblePersonAPI,
  businessTypeResponsiblePersonAPI,
} from "@/lib/api";

import SchedulerSettingsModal from "@/components/scheduler/SchedulerSettings";
import { set } from "react-datepicker/dist/date_utils";

type TabType = "company" | "businessType";

export default function ResponsibleManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("company");

  const [persons, setPersons] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);

  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedBusinessType, setSelectedBusinessType] = useState("");

  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>([]);
  const [selectedBusinessTypeIds, setSelectedBusinessTypeIds] = useState<number[]>([]);

  const [companyMappings, setCompanyMappings] = useState<any[]>([]);
  const [businessTypeMappings, setBusinessTypeMappings] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [showPersonModal, setShowPersonModal] = useState(false);

  const [personForm, setPersonForm] = useState({
    name: "",
    email: "",
  });
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null);

  const [showSchedulerModal, setShowSchedulerModal] = useState(false);

  // ==================================================
  // LOAD DATA
  // ==================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        personsResponse,
        companiesResponse,
        businessTypesResponse,
        companyMappingResponse,
        businessTypeMappingResponse,
      ] = await Promise.all([
        responsiblePersonAPI.getAll(),
        companyAPI.getAll(),
        businessTypeAPI.getAll(),
        companyResponsiblePersonAPI.getAll(),
        businessTypeResponsiblePersonAPI.getAll(),
      ]);

      setPersons(personsResponse.data || []);
      setCompanies(companiesResponse.data || []);
      setBusinessTypes(businessTypesResponse.data || []);
      setCompanyMappings(companyMappingResponse.data || []);
      setBusinessTypeMappings(businessTypeMappingResponse.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("Failed to load the assignment data.");
    } finally {
      setLoading(false);
    }
  };
  // ==================================================
  // PERSON SELECTED
  // ==================================================

  const handlePersonChange = async (value: string) => {
    setSelectedPerson(value);

    if (!value) {
      setSelectedCompanyIds([]);
      setSelectedBusinessTypeIds([]);
      return;
    }

    const personId = Number(value);

    try {
      const [companyResponse, businessTypeResponse] = await Promise.all([
        companyResponsiblePersonAPI.getByPerson(personId),
        businessTypeResponsiblePersonAPI.getByPerson(personId),
      ]);

      setSelectedCompanyIds(
        (companyResponse.data || []).map((item: any) =>
          Number(item.company_id)
        )
      );

      setSelectedBusinessTypeIds(
        (businessTypeResponse.data || []).map((item: any) =>
          Number(item.business_type_id)
        )
      );
    } catch (error) {
      console.error("Failed to load person assignments:", error);
      alert("Failed to load this person's assignments.");

      setSelectedCompanyIds([]);
      setSelectedBusinessTypeIds([]);
    }
  };
  // ==================================================
  // CHECKBOX HANDLERS
  // ==================================================

  const toggleCompany = (companyId: number) => { 
    const id = Number(companyId); 
    
    setSelectedCompanyIds((current) => 
      current.includes(id) 
        ? current.filter((existingId) => existingId !== id) 
        : [...current, id] 
      ); 
    };
     
  const toggleBusinessType = (businessTypeId: number) => { 
    const id = Number(businessTypeId); 
        
    setSelectedBusinessTypeIds((current) => 
      current.includes(id) 
        ? current.filter((existingId) => existingId !== id) 
        : [...current, id] 
      ); 
    };

  // ==================================================
  // SAVE COMPANY -> PERSONS
  // ==================================================

  const saveCompanyAssignments = async () => {
    if (!selectedPerson) {
      alert("Please select a responsible person.");
      return;
    }

    try {
      await companyResponsiblePersonAPI.updateByPerson(
        Number(selectedPerson),
        {
          company_ids: selectedCompanyIds,
        }
      );

      await loadData();

      alert("Company assignments saved successfully.");
    } catch (error) {
      console.error("Failed to save company assignments:", error);
      alert("Failed to save company assignments.");
    }
  };

  //==================================================
  // SAVE BUSINESS TYPE -> PERSONS 
  //===================================================

  const saveBusinessTypeAssignments = async () => {
    if (!selectedPerson) {
      alert("Please select a responsible person.");
      return;
    }

    try {
      await businessTypeResponsiblePersonAPI.updateByPerson(
        Number(selectedPerson),
        {
          business_type_ids: selectedBusinessTypeIds,
        }
      );

      await loadData();

      alert("Business type assignments saved successfully.");
    } catch (error) {
      console.error("Failed to save business type assignments:", error);
      alert("Failed to save business type assignments.");
    }
  };

  const handleEditPerson = () => {
    const person = persons.find(
      (p) => Number(p.id) === Number(selectedPerson)
    );

    if (!person) return;

    setEditingPersonId(Number(person.id));

    setPersonForm({
      name: person.name,
      email: person.email,
    });

    setShowPersonModal(true);
  };

  const handleDeletePerson = async () => {
    if (!selectedPerson) return;

    const person = persons.find(
      (p) => Number(p.id) === Number(selectedPerson)
    );

    const confirmed = window.confirm(
      `Deleting "${person?.name || "this person"}" will also remove their related assignments from the mapping table.\n\nAre you sure you want to continue?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await responsiblePersonAPI.delete(Number(selectedPerson));

      setSelectedPerson("");
      setSelectedCompanyIds([]);
      setSelectedBusinessTypeIds([]);
      setSelectedPersonIds([]);

      await loadData();
      alert("Responsible person deleted successfully.");
    } catch (error) {
      console.error("Failed to delete responsible person:", error);

      alert(
        error.response?.data?.detail ||
        "Failed to delete responsible person."
      );
    }
  };

  const handleSavePerson = async () => {
    try {
      if (editingPersonId !== null) {
        // EDIT
        await responsiblePersonAPI.update(
          editingPersonId,
          personForm
        );

        alert("Responsible person updated successfully.");
      } else {
        // ADD
        await responsiblePersonAPI.create(personForm);

        alert("Responsible person added successfully.");
      }

      await loadData();

      // Refresh dropdown
      const response = await responsiblePersonAPI.getAll();
      setPersons(response.data);

      // Reset
      setPersonForm({
        name: "",
        email: "",
      });

      setEditingPersonId(null);
      setShowPersonModal(false);

    } catch (error) {
      console.error("Failed to save person:", error);

      alert(
        error.response?.data?.detail ||
        "Failed to save responsible person."
      );
    }
  };

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Responsible Persons
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage responsible persons, companies and their assignments.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => setShowSchedulerModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Scheduler Settings
          </button>

          <button
            type="button"
            onClick={() => setShowPersonModal(true)}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Add Responsible Person
          </button>

        </div>
      </div>

      {/* ==================================================
          TABS
      ================================================== */}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-1">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("company")}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition ${
              activeTab === "company"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
              }`}
              >
              By Company
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("businessType")}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition ${
                activeTab === "businessType"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
                }`}
                >
                By Business Types
              </button>
            </div>
      </div>

      {/* MAIN CARD */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ================================================
            BY COMPANY
        ================================================ */}
        {activeTab === "company" && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Assign Companies to Responsible Persons
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a responsible person and choose the companies
                they are responsible for.
              </p>
            </div>

            {/* RESPONSIBLE PERSON SELECT */}
            <div className="mb-6 max-w-xl">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Responsible Person
              </label>

              <select
                value={selectedPerson}
                onChange={(e) => handlePersonChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="">Select responsible person</option>

                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} — {person.email}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleEditPerson}
                disabled={!selectedPerson}
                className={`mt-3 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 ${!selectedPerson ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
              Edit Person
              </button>
              <button
                type="button"
                onClick={handleDeletePerson}
                disabled={!selectedPerson}
                className={`mt-3 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 ${!selectedPerson ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
              Delete Person
              </button>
            </div>

            {/* COMPANY CHECKBOXES */}
            {selectedPerson && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Companies
                    </h3>

                    <p className="text-xs text-gray-500">
                      Select all companies assigned to this person.
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {selectedCompanyIds.length} selected
                  </span>
                </div>

                <div className="mb-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCompanyIds(
                        companies.map((company) => Number(company.id))
                      )
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCompanyIds([])}
                    className="text-sm font-medium text-gray-500 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
                  {companies.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No companies found.
                    </div>
                  ) : (
                    companies.map((company) => (
                      <label
                        key={company.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCompanyIds.includes(
                            Number(company.id)
                          )}
                          onChange={() => toggleCompany(company.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />

                        <span className="text-sm font-medium text-gray-900">
                          {company.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={saveCompanyAssignments}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                  >
                    Save Assignments
                  </button>
                </div>
              </>
            )}

            {/* COMPANY MAPPING TABLE */}
            <div className="mt-8 rounded-xl border border-gray-200 p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Company Mapping Table
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Company
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Responsible Person
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Email
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {companyMappings.length > 0 ? (
                      companyMappings.map((mapping) => (
                        <tr
                          key={mapping.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            {mapping.company_name}
                          </td>
                          <td className="px-4 py-3">
                            {mapping.person_name}
                          </td>
                          <td className="px-4 py-3">
                            {mapping.person_email}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          No company mappings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================
            BY BUSINESS TYPES
        ================================================ */}
        {activeTab === "businessType" && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Assign Business Types to Responsible Persons
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a responsible person and choose the business types
                they are responsible for.
              </p>
            </div>

            {/* RESPONSIBLE PERSON SELECT */}
            <div className="mb-6 max-w-xl">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Responsible Person
              </label>

              <select
                value={selectedPerson}
                onChange={(e) => handlePersonChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="">Select responsible person</option>

                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} — {person.email}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleEditPerson}
                disabled={!selectedPerson}
                className={`mt-3 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 ${!selectedPerson ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
              Edit Person
              </button>
              <button
                type="button"
                onClick={handleDeletePerson}
                disabled={!selectedPerson}
                className={`mt-3 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 ${!selectedPerson ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
              Delete Person
              </button>
            </div>
            {/* BUSINESS TYPE CHECKBOXES */}
            {selectedPerson && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Business Types
                    </h3>

                    <p className="text-xs text-gray-500">
                      Select all business types assigned to this person.
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {selectedBusinessTypeIds.length} selected
                  </span>
                </div>

                <div className="mb-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedBusinessTypeIds(
                        businessTypes.map((businessType) =>
                          Number(businessType.id)
                        )
                      )
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBusinessTypeIds([])}
                    className="text-sm font-medium text-gray-500 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
                  {businessTypes.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No business types found.
                    </div>
                  ) : (
                    businessTypes.map((businessType) => (
                      <label
                        key={businessType.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBusinessTypeIds.includes(
                            Number(businessType.id)
                          )}
                          onChange={() =>
                            toggleBusinessType(businessType.id)
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />

                        <span className="text-sm font-medium text-gray-900">
                          {businessType.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={saveBusinessTypeAssignments}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                  >
                    Save Assignments
                  </button>
                </div>
              </>
            )}

            {/* BUSINESS TYPE MAPPING TABLE */}
            <div className="mt-8 rounded-xl border border-gray-200 p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Business Type Mapping Table
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Business Type
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Responsible Person
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Email
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {businessTypeMappings.length > 0 ? (
                      businessTypeMappings.map((mapping) => (
                        <tr
                          key={mapping.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            {mapping.business_type_name}
                          </td>
                          <td className="px-4 py-3">
                            {mapping.person_name}
                          </td>
                          <td className="px-4 py-3">
                            {mapping.person_email}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          No business type mappings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          ADD RESPONSIBLE PERSON MODAL
      ================================================== */}

      {showPersonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                {editingPersonId
                  ? "Edit Responsible Person"
                  : "Add Responsible Person"}
              </h2>

              <p className="text-sm text-gray-500">
                Enter the person's details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPersonModal(false);
                setEditingPersonId(null);
                setPersonForm({
                  name: "",
                  email: "",
                });
              }}
              className="text-xl text-gray-400 hover:text-gray-700"
            >
              ×
            </button>

          </div>

          {/* FORM */}
          <form onSubmit={handleSavePerson}>

            {/* NAME */}
            <div className="mb-4">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>

              <input
                type="text"
                required
                value={personForm.name}
                onChange={(e) =>
                  setPersonForm({
                    ...personForm,
                    name: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
                placeholder="Enter name"
              />

            </div>

            {/* EMAIL */}
            <div className="mb-6">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                required
                value={personForm.email}
                onChange={(e) =>
                  setPersonForm({
                    ...personForm,
                    email: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
                placeholder="Enter email"
              />

            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3">

              {/* CANCEL */}
              <button
                type="button"
                onClick={() => {
                  setShowPersonModal(false);
                  setEditingPersonId(null);
                  setPersonForm({
                    name: "",
                    email: "",
                  });
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>

              {/* ADD / UPDATE */}
              <button
                type="submit"
                className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                {editingPersonId ? "Update Person" : "Add Person"}
              </button>

            </div>

          </form>

        </div>

      </div>
    )}
    {showSchedulerModal && (
      <SchedulerSettingsModal
      onClose={() => setShowSchedulerModal(false)}
      />
    )}
    </div>
  );
}