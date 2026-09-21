import { useEffect, useId, useRef, useState } from "react";
import { searchPlaces } from "../lib/geocode.js";
import { PersonBadge } from "./Bullet.jsx";


export default function PlacePicker({ label, color, place, onSelect, onRemove, canRemove }) {
  const listId = useId();
  const [query, setQuery] = useState(place ? place.name : "");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (place) setQuery(place.name);
  }, [place]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!open || query.trim().length < 3) {
      setOptions([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setFailed(false);
      searchPlaces(query, controller.signal)
        .then((results) => {
          setOptions(results);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setFailed(true);
            setLoading(false);
          }
        });
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  function choose(p) {
    onSelect(p);
    setQuery(p.name);
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
            placeholder="Search a restaurant, cafe, park, or address"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
              if (place) onSelect(null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
          />
          {open && loading && <p className="picker-status">Searching&hellip;</p>}
          {open && !loading && failed && <p className="picker-status">Couldn't search right now, try again.</p>}
          {open && !loading && options.length > 0 && (
            <ul id={listId} role="listbox" className="options">
              {options.map((p, i) => (
                <li
                  key={p.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? "option is-active" : "option"}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(p);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="option-name">{p.name}</span>
                  <span className="option-meta">{p.fullName}</span>
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
    </div>
  );
}
