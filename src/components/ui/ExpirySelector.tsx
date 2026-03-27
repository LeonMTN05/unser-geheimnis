"use client";

import { motion } from "framer-motion";
import { ALLOWED_TTL_HOURS, ValidTTL } from "@/lib/constants";

interface ExpirySelectorProps {
  selectedTTL: ValidTTL;
  onChange: (ttl: ValidTTL) => void;
  disabled?: boolean;
}

export function ExpirySelector({ selectedTTL, onChange, disabled }: ExpirySelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-secondary">
        Gültigkeitsdauer:
      </label>
      <div className="flex flex-wrap gap-2">
        {ALLOWED_TTL_HOURS.map((hours) => {
          const isSelected = selectedTTL === hours;
          const display = hours >= 24 ? `${hours / 24}T` : `${hours}h`;
          
          return (
            <button
              key={hours}
              type="button"
              onClick={() => !disabled && onChange(hours)}
              disabled={disabled}
              className={`relative px-4 py-1.5 text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-card disabled:opacity-50 ${
                isSelected ? "text-primary" : "text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-opacity-80"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="expiry-pill-bg"
                  className="absolute inset-0 rounded-full bg-accent -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{display}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
