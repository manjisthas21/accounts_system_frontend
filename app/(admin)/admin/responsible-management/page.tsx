"use client";

import { useEffect, useState } from "react";

import {
  companyAPI,
  responsiblePersonAPI,
  companyResponsiblePersonAPI,
  schedulerAPI,
} from "@/lib/api";

import SchedulerSettingsModal from "@/components/scheduler/SchedulerSettings";

export default function ResponsibleManagementPage() {
  const [activeTab, setActiveTab] = useState("person");

  const [persons, setPersons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [mappings, setMappings] = useState([]);

  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [selectedPersonIds, setSelectedPersonIds] = useState([]);

  const [loading, setLoading] = useState(false);

  const [showPersonModal, setShowPersonModal] = useState(false);

  const [personForm, setPersonForm] = useState({
    name: "",
    email: "",
  });
  const [editingPersonId, setEditingPersonId] = useState(null);

  const [showSchedulerModal, setShowSchedulerModal] = useState(false);

  // ==================================================
  // LOAD DATA
  // ==================================================

  useEffect(() => {
    loadData();
    loadMappings();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        personsResponse,
        companiesResponse,
      ] = await Promise.all([
        responsiblePersonAPI.getAll(),
        companyAPI.getAll(),
      ]);

      setPersons(personsResponse.data || []);
      setCompanies(companiesResponse.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMappings = async () => {
    try {
      const response = await companyResponsiblePersonAPI.getAll();

      console.log("MAPPING API RESPONSE:", response.data);

      setMappings(response.data || []);
    } catch (error) {
      console.error("Failed to load mappings:", error);
    }
  };

  // ==================================================
  // PERSON SELECTED
  // ==================================================

  const handlePersonChange = async (value) => {
    if (!value) {
      setSelectedPerson("");
      setSelectedCompanyIds([]);
      return;
    }

    const personId = Number(value);

    setSelectedPerson(personId);

    // Clear company-side selection
    setSelectedCompany("");
    setSelectedPersonIds([]);

    try {
      const response =
        await companyResponsiblePersonAPI.getByPerson(personId);

      const assignedCompanies = response.data || [];

      setSelectedCompanyIds(
        assignedCompanies.map((company) => Number(company.company_id))
      );
    } catch (error) {
      console.error("Failed to load assigned companies:", error);
      setSelectedCompanyIds([]);
    }
  };

  const handleCompanyChange = async (value) => {
    setSelectedCompany(value);

    if (!value) {
      setSelectedPersonIds([]);
      return;
    }

    try {
      const response =
        await companyResponsiblePersonAPI.getByCompany(value);

      const personIds = response.data.map((item) =>
        Number(item.person_id)
      );

      setSelectedPersonIds(personIds);
    } catch (error) {
      console.error("Failed to load company assignments:", error);
      setSelectedPersonIds([]);
    }
  };
  // ==================================================
  // COMPANY CHECKBOX
  // ==================================================

  const toggleCompany = (companyId) => {
    const id = Number(companyId);

    setSelectedCompanyIds((current) => {
      if (current.includes(id)) {
        return current.filter((existingId) => existingId !== id);
      }

      return [...current, id];
    });
  };

  // ==================================================
  // PERSON CHECKBOX
  // ==================================================

  const togglePerson = (personId) => {
    const id = Number(personId);

    setSelectedPersonIds((current) => {
      if (current.includes(id)) {
        return current.filter((existingId) => existingId !== id);
      }

      return [...current, id];
    });
  };

  // ==================================================
  // SAVE PERSON -> COMPANIES
  // ==================================================

  const savePersonAssignments = async () => {
    if (!selectedPerson) {
      alert("Please select a responsible person.");
      return;
    }

    try {
      await companyResponsiblePersonAPI.updateByPerson(
        selectedPerson,
        {
          company_ids: selectedCompanyIds,
        }
      );

      await loadMappings();

      alert("Company assignments updated successfully.");
    } catch (error) {
      console.error("Failed to update assignments:", error);
      alert("Failed to update assignments.");
    }
  };

  // ==================================================
  // SAVE COMPANY -> PERSONS
  // ==================================================

  const saveCompanyAssignments = async () => {
    if (!selectedCompany) {
      alert("Please select a company.");
      return;
    }

    try {
      await companyResponsiblePersonAPI.updateByCompany(
        selectedCompany,
        {
          person_ids: selectedPersonIds,
        }
      );

      await loadMappings();

      alert("Responsible person assignments updated successfully.");
    } catch (error) {
      console.error("Failed to update assignments:", error);
      alert("Failed to update assignments.");
    }
  };

  // ==================================================
  // CREATE PERSON
  // ==================================================

  const handleCreatePerson = async (e) => {
    e.preventDefault();

    try {
      await responsiblePersonAPI.create(personForm);

      setPersonForm({
        name: "",
        email: "",
      });

      setShowPersonModal(false);

      await loadData();

      alert("Responsible person created successfully.");
    } catch (error) {
      console.error("Failed to create responsible person:", error);
      alert("Failed to create responsible person.");
    }
  };

  // ==================================================
  // DELETE MAPPING
  // ==================================================

  const handleDeleteMapping = async (companyId, personId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this mapping? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      await companyResponsiblePersonAPI.delete(companyId, personId);

      await loadMappings();

      alert("Mapping deleted successfully.");
    } catch (error) {
      console.error("Failed to delete mapping:", error);
      alert("Failed to delete mapping.");
    }
  };

  const handleEditPerson = () => {
    const person = persons.find(
      (p) => Number(p.id) === Number(selectedPerson)
    );

    if (!person) return;

    setEditingPersonId(person.id);

    setPersonForm({
      name: person.name,
      email: person.email,
    });

    setShowPersonModal(true);
  };

  const handleDeletePerson = async (personId) => {
    if (!personId) return;

    const person = persons.find(
      (p) => Number(p.id) === Number(personId)
    );

    const confirmed = window.confirm(
      `Deleting "${person?.name || "this person"}" will also remove their related assignments from the mapping table.\n\nAre you sure you want to continue?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await responsiblePersonAPI.delete(personId);

      alert("Responsible person deleted successfully.");

      setSelectedPerson("");

      const response = await responsiblePersonAPI.getAll();
      setPersons(response.data);

      await loadMappings();
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
      if (editingPersonId) {
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

        <div className="flex">

          <button
            type="button"
            onClick={() => setActiveTab("person")}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition ${
              activeTab === "person"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            By Responsible Person
          </button>

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

        </div>
      </div>

      {/* ==================================================
          MAIN CARD
      ================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* ==================================================
            BY PERSON
        ================================================== */}

        {activeTab === "person" && (
          <div className="p-6">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-gray-900">
                Assign Companies
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a responsible person and assign one or more companies.
              </p>

            </div>

            {/* PERSON SELECT */}

            <div className="mb-8 max-w-xl">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Responsible Person
              </label>

              <select
                value={selectedPerson}
                onChange={(e) => handlePersonChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >

                <option value="">
                  Select responsible person
                </option>

                {persons.map((person) => (
                  <option
                    key={person.id}
                    value={person.id}
                  >
                    {person.name} — {person.email}
                  </option>
                ))}

              </select>
              
              <button
                type="button"
                onClick={handleEditPerson}
                disabled={!selectedPerson}
                className="rounded bg-blue-500 px-3 py-2 text-white disabled:opacity-50"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDeletePerson(selectedPerson)}
                disabled={!selectedPerson}
                className="ml-2 rounded bg-red-500 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>

            </div>

            {/* COMPANY LIST */}

            {selectedPerson && (
              <div>

                <div className="mb-3 flex items-center justify-between">

                  <div>

                    <h3 className="text-sm font-semibold text-gray-900">
                      Companies
                    </h3>

                    <p className="text-xs text-gray-500">
                      Select all companies this person is responsible for.
                    </p>

                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {selectedCompanyIds.length} selected
                  </span>

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

                        <div>

                          <p className="text-sm font-medium text-gray-900">
                            {company.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            Company ID: {company.id}
                          </p>

                        </div>

                      </label>

                    ))
                  )}

                </div>

                <div className="mt-6 flex justify-end">

                  <button
                    type="button"
                    onClick={savePersonAssignments}
                    className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Save Assignments
                  </button>

                </div>

              </div>
            )}

          </div>
        )}

        {/* ==================================================
            BY COMPANY
        ================================================== */}

        {activeTab === "company" && (
          <div className="p-6">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-gray-900">
                Assign Responsible Persons
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a company and assign one or more responsible persons.
              </p>

            </div>

            {/* COMPANY SELECT */}

            <div className="mb-8 max-w-xl">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Company
              </label>

              <select
                value={selectedCompany}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >

                <option value="">
                  Select company
                </option>

                {companies.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                ))}

              </select>

            </div>

            {/* PERSON LIST */}

            {selectedCompany && (
              <div>

                <div className="mb-3 flex items-center justify-between">

                  <div>

                    <h3 className="text-sm font-semibold text-gray-900">
                      Responsible Persons
                    </h3>

                    <p className="text-xs text-gray-500">
                      Select all persons responsible for this company.
                    </p>

                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {selectedPersonIds.length} selected
                  </span>

                </div>

                <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">

                  {persons.length === 0 ? (

                    <div className="p-8 text-center text-sm text-gray-500">
                      No responsible persons found.
                    </div>

                  ) : (

                    persons.map((person) => (

                      <label
                        key={person.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50"
                      >

                        <input
                          type="checkbox"
                          checked={selectedPersonIds.includes(
                            Number(person.id)
                          )}
                          onChange={() => togglePerson(person.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />

                        <div>

                          <p className="text-sm font-medium text-gray-900">
                            {person.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            {person.email}
                          </p>

                        </div>

                      </label>

                    ))
                  )}

                </div>

                <div className="mt-6 flex justify-end">

                  <button
                    type="button"
                    onClick={saveCompanyAssignments}
                    className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Save Assignments
                  </button>

                </div>

              </div>
            )}

          </div>
        )}

        {/* ==================================================
            CURRENT MAPPINGS
        ================================================== */}

        <div className="border-t border-gray-200 p-6">

          <div className="mb-4">

            <h2 className="text-lg font-semibold text-gray-900">
              Current Assignments
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Companies and their assigned responsible persons.
            </p>

          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">

            <table className="w-full text-left">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Company
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Responsible Person
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {mappings.length === 0 ? (

                  <tr>

                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No mappings found.
                    </td>

                  </tr>

                ) : (

                  mappings.map((mapping) => (

                    <tr
                      key={mapping.id}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {mapping.company_name}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {mapping.person_name}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {mapping.person_email}
                      </td>

                      <td className="px-4 py-3">

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteMapping(mapping.company_id, mapping.person_id)
                          }
                          className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>

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