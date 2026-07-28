interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Small themed "are you sure?" modal, used for destructive actions like
 * deleting an album or playlist. Kept generic so any confirm/cancel flow
 * can reuse it rather than falling back to the browser's window.confirm.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isSubmitting = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center overflow-y-auto z-[70] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full relative shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-300 mb-6">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
