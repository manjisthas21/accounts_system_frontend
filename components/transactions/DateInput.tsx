import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

/**
 * Payroll DatePicker Component
 *
 * Reusable custom date picker for Payroll Frontend.
 *
 * Supports:
 * - date selection
 * - month selection
 * - year selection
 * - min/max date validation
 * - disabled state
 * - clear button
 * - payroll theme styling
 */
const DatePicker = ({
  label,
  value,
  onChange,
  mode = "date",
  name,
  placeholder,
  min,
  max,
  disabled = false,
  required = false,
  clearable = true,
  error,
  helperText,
  className = "",
}) => {
  const pickerRef = useRef(null);
  const inputRef = useRef(null);
  const popupRef = useRef(null);

  const selectedDate = useMemo(() => parseValue(value), [value]);

  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const [viewMode, setViewMode] = useState(mode === "date" ? "date" : mode);
  const [popupStyle, setPopupStyle] = useState({
    position: "fixed",
    width: 280,
    zIndex: 9999,
  });

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const updatePopupPosition = useCallback(() => {
    if (!inputRef.current) return;

    const viewportMargin = 10;
    const popupGap = 8;
    const inputRect = inputRef.current.getBoundingClientRect();
    // Do not measure width from the initial portal render: a bare <div> is a
    // block element and would otherwise report document-body width.
    const popupWidth = Math.min(280, Math.max(0, window.innerWidth - viewportMargin * 2));
    const popupHeight = popupRef.current?.offsetHeight || 360;
    const availableBelow = window.innerHeight - inputRect.bottom - viewportMargin;
    const availableAbove = inputRect.top - viewportMargin;
    const placeBelow =
      availableBelow >= popupHeight || availableBelow >= availableAbove;
    const availableHeight = Math.max(
      0,
      placeBelow ? availableBelow : availableAbove,
    );
    const maxLeft = Math.max(viewportMargin, window.innerWidth - popupWidth - viewportMargin);

    setPopupStyle({
      position: "fixed",
      top: placeBelow
        ? Math.max(viewportMargin, Math.min(inputRect.bottom + popupGap, window.innerHeight - viewportMargin - Math.min(popupHeight, availableHeight)))
        : Math.max(viewportMargin, inputRect.top - popupGap - Math.min(popupHeight, availableHeight)),
      left: Math.max(viewportMargin, Math.min(inputRect.left, maxLeft)),
      width: popupWidth,
      maxHeight: Math.max(0, availableHeight),
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (
        pickerRef.current?.contains(event.target) ||
        popupRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) return undefined;

    window.addEventListener("scroll", updatePopupPosition, true);
    window.addEventListener("resize", updatePopupPosition);

    return () => {
      window.removeEventListener("scroll", updatePopupPosition, true);
      window.removeEventListener("resize", updatePopupPosition);
    };
  }, [isOpen, updatePopupPosition]);

  // Measure after the portal mounts, then again whenever its calendar view changes.
  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePopupPosition();
  }, [isOpen, viewMode, viewDate, updatePopupPosition]);

  const handleInputClick = () => {
    if (disabled) return;

    setIsOpen((prev) => !prev);
    setViewMode(mode === "date" ? "date" : mode);
  };

  const handleDateSelect = (date) => {
    if (isDateDisabled(date, min, max)) return;

    onChange?.(formatDateValue(date));
    setIsOpen(false);
  };

  const handleMonthSelect = (monthIndex) => {
    const nextDate = new Date(currentYear, monthIndex, 1);

    if (mode === "month") {
      onChange?.(formatMonthValue(nextDate));
      setIsOpen(false);
      return;
    }

    setViewDate(nextDate);
    setViewMode("date");
  };

  const handleYearSelect = (year) => {
    const nextDate = new Date(year, currentMonth, 1);

    if (mode === "year") {
      onChange?.(String(year));
      setIsOpen(false);
      return;
    }

    setViewDate(nextDate);
    setViewMode(mode === "month" ? "month" : "date");
  };

  const handleClear = (event) => {
    event.stopPropagation();
    onChange?.("");
    setIsOpen(false);
  };

  const handleTodaySelect = () => {
    const today = new Date();

    if (isDateDisabled(today, min, max)) return;

    if (mode === "date") {
      onChange?.(formatDateValue(today));
    }

    if (mode === "month") {
      onChange?.(formatMonthValue(today));
    }

    if (mode === "year") {
      onChange?.(String(today.getFullYear()));
    }

    setViewDate(today);
    setIsOpen(false);
  };

  const goToPrevious = () => {
    if (viewMode === "date") {
      setViewDate(new Date(currentYear, currentMonth - 1, 1));
      return;
    }

    if (viewMode === "month") {
      setViewDate(new Date(currentYear - 1, currentMonth, 1));
      return;
    }

    setViewDate(new Date(currentYear - 12, currentMonth, 1));
  };

  const goToNext = () => {
    if (viewMode === "date") {
      setViewDate(new Date(currentYear, currentMonth + 1, 1));
      return;
    }

    if (viewMode === "month") {
      setViewDate(new Date(currentYear + 1, currentMonth, 1));
      return;
    }

    setViewDate(new Date(currentYear + 12, currentMonth, 1));
  };

  const displayValue = getDisplayValue(value, mode);

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <button
        ref={inputRef}
        type="button"
        name={name}
        disabled={disabled}
        onClick={handleInputClick}
        className={`
    flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm transition
    ${error
            ? "border-red-400 focus:ring-red-100"
            : isOpen
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-gray-300 hover:border-blue-400"
          }
    ${disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400"
            : "cursor-pointer text-gray-700"
          }
    focus:outline-none focus:ring-2 focus:ring-blue-100
  `}
      >
        <span className={displayValue ? "text-gray-700" : "text-gray-400"}>
          {displayValue || placeholder || "Select date"}
        </span>

        <span className="flex items-center gap-2 text-gray-400">
          {clearable && value && !disabled && (
            <FiX
              size={15}
              onClick={handleClear}
              className="rounded-full transition hover:text-red-500"
            />
          )}

          <FiCalendar
            size={16}
            className={`transition ${isOpen ? "text-blue-600" : "text-gray-400"
              }`}
          />
        </span>
      </button>

      {(error || helperText) && (
        <p
          className={`mt-1.5 text-xs ${error ? "text-red-500" : "text-slate-500"
            }`}
        >
          {error || helperText}
        </p>
      )}

    {isOpen &&
       createPortal(
    <div
      ref={popupRef}
      style={popupStyle}
      className="z-[9999] overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5"
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2.5">
        <CalendarHeader
          viewMode={viewMode}
          viewDate={viewDate}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onTitleClick={() => {
            if (viewMode === "date") {
              setViewMode("month");
            } else if (viewMode === "month") {
              setViewMode("year");
            }
          }}
        />
      </div>

      <div className="p-3">
        {viewMode === "date" && (
          <DateGrid
            viewDate={viewDate}
            selectedDate={selectedDate}
            min={min}
            max={max}
            onSelect={handleDateSelect}
          />
        )}

        {viewMode === "month" && (
          <MonthGrid
            selectedDate={selectedDate}
            currentYear={currentYear}
            onSelect={handleMonthSelect}
          />
        )}

        {viewMode === "year" && (
          <YearGrid
            selectedDate={selectedDate}
            currentYear={currentYear}
            onSelect={handleYearSelect}
          />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-3 py-2.5">
        <button
          type="button"
          onClick={handleTodaySelect}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
        >
          Today
        </button>

        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white hover:text-red-500"
          >
            Clear
          </button>
        )}
      </div>
    </div>,
    document.body
  )}
    </div>
  );
};

export default DatePicker;

const CalendarHeader = ({
  viewMode,
  viewDate,
  onPrevious,
  onNext,
  onTitleClick,
}) => {
  const title =
    viewMode === "date"
      ? `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`
      : viewMode === "month"
        ? String(viewDate.getFullYear())
        : `${getYearStart(viewDate.getFullYear())} - ${getYearStart(viewDate.getFullYear()) + 11
        }`;

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onPrevious}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
      >
        <FiChevronLeft size={18} />
      </button>

      <button
        type="button"
        onClick={onTitleClick}
        className="rounded-xl px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
      >
        {title}
      </button>

      <button
        type="button"
        onClick={onNext}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
      >
        <FiChevronRight size={18} />
      </button>
    </div>
  );
};

const DateGrid = ({ viewDate, selectedDate, min, max, onSelect }) => {
  const dates = getCalendarDates(viewDate);

  return (
    <>
      <div className="mb-2 grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold text-slate-400">
        {WEEK_DAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {dates.map((date) => {
          const isCurrentMonth = date.getMonth() === viewDate.getMonth();
          const isSelected = isSameDate(date, selectedDate);
          const isToday = isSameDate(date, new Date());
          const isDisabled = isDateDisabled(date, min, max);

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(date)}
              className={`
               relative flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150
                ${!isCurrentMonth ? "text-slate-300" : "text-slate-700"}
                ${isToday && !isSelected
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                  : ""
                }
                ${isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : ""
                }
                ${isDisabled
                  ? "cursor-not-allowed text-slate-300 line-through hover:bg-transparent"
                  : !isSelected
                    ? "hover:bg-blue-50 hover:text-blue-700"
                    : ""
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </>
  );
};

const MonthGrid = ({ selectedDate, currentYear, onSelect }) => (
  <div className="grid grid-cols-3 gap-2">
    {MONTHS.map((month, index) => {
      const isSelected =
        selectedDate &&
        selectedDate.getFullYear() === currentYear &&
        selectedDate.getMonth() === index;

      return (
        <button
          key={month}
          type="button"
          onClick={() => onSelect(index)}
          className={`
           rounded-lg px-2 py-2.5 text-xs font-semibold transition-all duration-150
            ${isSelected
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
            }
          `}
        >
          {month.slice(0, 3)}
        </button>
      );
    })}
  </div>
);

const YearGrid = ({ selectedDate, currentYear, onSelect }) => {
  const startYear = getYearStart(currentYear);
  const years = Array.from({ length: 12 }, (_, index) => startYear + index);

  return (
    <div className="grid grid-cols-3 gap-2">
      {years.map((year) => {
        const isSelected = selectedDate?.getFullYear() === year;

        return (
          <button
            key={year}
            type="button"
            onClick={() => onSelect(year)}
            className={`
             rounded-lg px-2 py-2.5 text-xs font-semibold transition-all duration-150
              ${isSelected
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
              }
            `}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
};

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const parseValue = (value) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatMonthValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const getDisplayValue = (value, mode) => {
  if (!value) return "";

  if (mode === "year") {
    return String(value);
  }

  if (mode === "month") {
    const [year, month] = String(value).split("-");

    if (!year || !month) return "";

    return `${MONTHS[Number(month) - 1]} ${year}`;
  }

  const date = parseValue(value);

  if (!date) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getPlaceholder = (mode) => {
  if (mode === "month") return "Select month";
  if (mode === "year") return "Select year";

  return "Select date";
};

const getCalendarDates = (viewDate) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);

  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return date;
  });
};

const isSameDate = (date1, date2) => {
  if (!date1 || !date2) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isDateDisabled = (date, min, max) => {
  const selected = new Date(formatDateValue(date));

  if (min && selected < new Date(min)) return true;
  if (max && selected > new Date(max)) return true;

  return false;
};

const getYearStart = (year) => Math.floor(year / 12) * 12;
