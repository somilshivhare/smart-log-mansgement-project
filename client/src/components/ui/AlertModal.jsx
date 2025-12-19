import React from "react";
import { Button } from "@/components/ui/button";

export default function AlertModal({
  open,
  title = "Notice",
  message = "",
  primaryLabel = "OK",
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-gray-300 max-w-md w-full p-6 rounded-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          {secondaryLabel && (
            <Button
              onClick={onSecondary}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              {secondaryLabel}
            </Button>
          )}
          <Button
            onClick={onPrimary}
            className="bg-gray-800 text-white hover:bg-gray-900"
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
