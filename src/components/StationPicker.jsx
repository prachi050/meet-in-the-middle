import { useEffect, useId, useMemo, useState } from "react";
import { searchStations } from "../lib/search.js";
import { BOROUGHS } from "../lib/lines.js";
import { Bullets, PersonBadge } from "./Bullet.jsx";

export default function StationPicker({ label, color, station, searchIndex, onSelect, onRemove, canRemove }) {
  const listId = useId();
  const [query, setQuery] = useState(station ? station.display : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // When the parent sets a station (shared link, example button), show its name.
  useEffect(() => {
    if (station) setQuery(station.display);
  }, [station]);

  const options = useMemo(() => (open ? searchStations(searchIndex, query) : []), [open, query, searchIndex]);

  function choose(s) {
    onSelect(s);
    setQuery(s.display);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="picker">
      <div className="picker-row">
        <PersonBadge color={color} size={40} />
        <div className="picker-field">
          <label htmlFor={`${listId}-input`}>{label}</label>
          <input
            id={`${listId}-input`}
            type="text"
            role="combobox"
            aria-expanded={open && options.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            spellCheck="false"
            placeholder="Search a subway station"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
              if (station) onSelect(null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
          />
          {open && options.length > 0 && (
            <ul id={listId} role="listbox" className="options">
              {options.map((s, i) => (
                <li
                  key={s.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? "option is-active" : "option"}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(s);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="option-name">{s.name}</span>
                  <span className="option-meta">
                    {BOROUGHS[s.borough]}
                    <Bullets routes={s.routes} size="sm" />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {canRemove && (
          <button type="button" className="text-btn" onClick={onRemove} aria-label={`Remove ${label}`}>
            Remove
          </button>
        )}
      </div>
      {station && (
        <p className="picker-picked">
          <Bullets routes={station.routes} size="sm" />
          <span>{BOROUGHS[station.borough]}</span>
        </p>
      )}
    </div>
  );
}
