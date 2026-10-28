"use client";

import { useEffect, useState } from "react";
import { schedulerAPI } from "@/lib/api";

interface SchedulerSettings {
  enabled: boolean;
  frequency: "daily" | "weekly";
  days_of_week: string[];
  times: string[];
  report_grouping: "company" | "business_type" | "both";
}

interface SchedulerSettingsModalProps {
  onClose: () => void;
}

const defaultSettings: SchedulerSettings = {
  enabled: true,
  frequency: "weekly",
  days_of_week: ["mon"],
  times: ["09:00"],
  report_grouping: "both",
};

const days = [
  { label: "Mon", value: "mon" },
  { label: "Tue", value: "tue" },
  { label: "Wed", value: "wed" },
  { label: "Thu", value: "thu" },
  { label: "Fri", value: "fri" },
  { label: "Sat", value: "sat" },
  { label: "Sun", value: "sun" },
];

export default function SchedulerSettingsModal({
  onClose,
}: SchedulerSettingsModalProps) {
  const [settings, setSettings] =
    useState<SchedulerSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load saved settings when the modal opens
  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const response = await schedulerAPI.getAll();
        const data = response.data;

        if (!cancelled) {
          setSettings({
            enabled: data.enabled,
            frequency: data.frequency,
            days_of_week: data.days_of_week || [],
            times: data.times?.length ? data.times : ["09:00"],
            report_grouping: data.report_grouping || "both",
          });
        }
      } catch (error) {
        // A 404 means settings have not been created yet.
        console.log("Using default scheduler settings.", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDayChange = (day: string) => {
    setSettings((previous) => ({
      ...previous,
      days_of_week: previous.days_of_week.includes(day)
        ? previous.days_of_week.filter((item) => item !== day)
        : [...previous.days_of_week, day],
    }));
  };

  const handleFrequencyChange = (frequency: "daily" | "weekly") => {
    setSettings((previous) => ({
      ...previous,
      frequency,
      days_of_week:
        frequency === "weekly"
          ? previous.days_of_week.length
            ? previous.days_of_week
            : ["mon"]
          : [],
    }));
  };

  const handleTimeChange = (index: number, value: string) => {
    setSettings((previous) => ({
      ...previous,
      times: previous.times.map((time, i) =>
        i === index ? value : time
      ),
    }));
  };

  const addTime = () => {
    setSettings((previous) => ({
      ...previous,
      times: [...previous.times, "17:00"],
    }));
  };

  const removeTime = (index: number) => {
    setSettings((previous) => ({
      ...previous,
      times: previous.times.filter((_, i) => i !== index),
    }));
  };

  const saveSettings = async () => {
    if (
      settings.frequency === "weekly" &&
      settings.days_of_week.length === 0
    ) {
      alert("Please select at least one day.");
      return;
    }

    if (
      settings.times.length === 0 ||
      settings.times.some((time) => !time)
    ) {
      alert("Please select at least one valid schedule time.");
      return;
    }

    if (new Set(settings.times).size !== settings.times.length) {
      alert("Please remove duplicate schedule times.");
      return;
    }

    setSaving(true);

    try {
      await schedulerAPI.update(settings);
      alert("Scheduler settings saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving scheduler settings:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save scheduler settings."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Scheduler Settings
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-2xl text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-gray-500">
            Loading scheduler settings...
          </p>
        ) : (
          <div className="space-y-6">
            {/* Enable scheduler */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-gray-800">
                  Enable Scheduler
                </p>
                <p className="text-sm text-gray-500">
                  Automatically send outstanding reports.
                </p>
              </div>

              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    enabled: event.target.checked,
                  }))
                }
                className="h-5 w-5 accent-indigo-600"
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Frequency
              </label>

              <select
                value={settings.frequency}
                onChange={(event) =>
                  handleFrequencyChange(
                    event.target.value as "daily" | "weekly"
                  )
                }
                className="w-full rounded-lg border px-3 py-2 text-gray-800"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Outstanding Report Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Outstanding Report Type
              </label>

              <select
                value={settings.report_grouping}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    report_grouping: event.target.value as
                    | "company"
                    | "business_type"
                    | "both",
                  }))
                }
                className="w-full rounded-lg border px-3 py-2 text-gray-800"
              >
                <option value="company">Company-wise</option>
                <option value="business_type">Business-type-wise</option>
                <option value="both">Both</option>
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Choose whether outstanding reports should be sent by company,business type, or both.
              </p>
            </div>

            {/* Days */}
            {settings.frequency === "weekly" && (
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Days of the Week
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {days.map((day) => (
                    <label
                      key={day.value}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={settings.days_of_week.includes(
                          day.value
                        )}
                        onChange={() => handleDayChange(day.value)}
                        className="accent-indigo-600"
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Times */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Schedule Times
                </label>

                <button
                  type="button"
                  onClick={addTime}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  + Add Time
                </button>
              </div>

              <div className="space-y-3">
                {settings.times.map((time, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="time"
                      value={time}
                      onChange={(event) =>
                        handleTimeChange(index, event.target.value)
                      }
                      className="flex-1 rounded-lg border px-3 py-2 text-gray-800"
                    />

                    {settings.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTime(index)}
                        className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Use 24-hour time, such as 09:00 or 17:00.
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}